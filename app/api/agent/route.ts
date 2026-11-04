import { env } from 'cloudflare:workers';
import { runFxAgent } from '../../../lib/fx-agent.mjs';
import { validateInput } from '../../../lib/fx-tools.mjs';
import { useQuota, callerHash } from '../../../lib/fx-quota';
export const dynamic='force-dynamic';
type RuntimeEnv=Cloudflare.Env & {FX_LLM_API_KEY?:string;FX_LLM_BASE_URL?:string;FX_LLM_MODEL?:string;FX_MAX_DAILY_CALLS?:string};
const runtime=()=>env as RuntimeEnv;
export function GET(){const e=runtime();return Response.json({configured:!!(e.FX_LLM_API_KEY&&e.FX_LLM_BASE_URL&&e.FX_LLM_MODEL&&e.DB),model:e.FX_LLM_MODEL||null,max_model_calls:4,privacy:'Questions and supplied headlines are sent to the configured LLM when you run an analysis. Saved budgets are not sent.',tools:['get_traditional_forecast','compare_traditional_models','get_official_policy_news'],public_demo_daily_call_cap:Math.min(120,Math.max(4,Number(e.FX_MAX_DAILY_CALLS)||60))},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:Request){
 const e=runtime();if(!e.FX_LLM_API_KEY||!e.FX_LLM_BASE_URL||!e.FX_LLM_MODEL||!e.DB)return Response.json({error:'The server-side LLM is not configured yet.'},{status:503});
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Cross-origin requests are not supported.'},{status:403});
 if(!request.headers.get('content-type')?.includes('application/json'))return Response.json({error:'Use application/json.'},{status:415});
 if(Number(request.headers.get('content-length')||0)>12000)return Response.json({error:'Request too large.'},{status:413});
 let input;try{const raw=await request.text();if(raw.length>12000)return Response.json({error:'Request too large.'},{status:413});input=validateInput(JSON.parse(raw));}catch(error){return Response.json({error:error instanceof Error?error.message:'Invalid request.'},{status:400});}
 const now=Date.now(),day=new Date(now).toISOString().slice(0,10),hour=new Date(now).toISOString().slice(0,13),db=e.DB;
 try{await db.prepare('DELETE FROM fx_usage_counters WHERE expires_at < ?').bind(now-86400000).run();await useQuota(db,'visitor:'+await callerHash(request)+':'+hour,6,now+7200000);}catch(error){return Response.json({error:error instanceof Error?error.message:'Usage accounting is unavailable.'},{status:(error as {status?:number})?.status||503});}
 const dailyLimit=Math.min(120,Math.max(4,Number(e.FX_MAX_DAILY_CALLS)||60));const encoder=new TextEncoder(),cancelled=new AbortController();let open=true;
 const signal=AbortSignal.any([request.signal,cancelled.signal]);
 const stream=new ReadableStream({async start(controller){const emit=(event:unknown)=>{if(open){try{controller.enqueue(encoder.encode(JSON.stringify(event)+'\n'));}catch{open=false;cancelled.abort();}}};try{await runFxAgent(input,{url:e.FX_LLM_BASE_URL,key:e.FX_LLM_API_KEY,model:e.FX_LLM_MODEL},{emit,signal,beforeModel:async()=>{if(!open||signal.aborted)throw new Error('Analysis cancelled.');await useQuota(db,'model:'+day,dailyLimit,now+172800000);}});}catch(error){emit({type:'error',message:error instanceof Error?error.message:'Analysis failed. No simulated response was substituted.'});}finally{if(open){open=false;try{controller.close();}catch{}}}},cancel(){open=false;cancelled.abort();}});
 return new Response(stream,{headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store, no-transform','X-Content-Type-Options':'nosniff'}});
}
