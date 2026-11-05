import {env} from 'cloudflare:workers';
import {runFxChat,validateChat} from '../../../lib/fx-chat.mjs';
import {useQuota,callerHash} from '../../../lib/fx-quota';
export const dynamic='force-dynamic';
type RuntimeEnv=Cloudflare.Env & {FX_LLM_API_KEY?:string;FX_LLM_BASE_URL?:string;FX_LLM_MODEL?:string;FX_MAX_DAILY_CALLS?:string;FX_SEARCH_API_KEY?:string};
const runtime=()=>env as RuntimeEnv;
export function GET(){const e=runtime();return Response.json({configured:!!(e.FX_LLM_API_KEY&&e.FX_LLM_BASE_URL&&e.FX_LLM_MODEL&&e.DB),model:e.FX_LLM_MODEL||null,search:{provider:'Tavily',mode:e.FX_SEARCH_API_KEY?'keyed':'keyless',available:true},max_model_calls:6},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:Request){
 const e=runtime();if(!e.FX_LLM_API_KEY||!e.FX_LLM_BASE_URL||!e.FX_LLM_MODEL||!e.DB)return Response.json({error:'The model connection is unavailable.'},{status:503});
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Cross-origin requests are not supported.'},{status:403});
 if(!request.headers.get('content-type')?.includes('application/json'))return Response.json({error:'Use application/json.'},{status:415});
 if(Number(request.headers.get('content-length')||0)>64000)return Response.json({error:'The conversation is too long. Start a new chat.'},{status:413});
 let input;try{const body=await request.text();if(new TextEncoder().encode(body).length>64000)return Response.json({error:'The conversation is too long. Start a new chat.'},{status:413});input=validateChat(JSON.parse(body));}catch(error){return Response.json({error:error instanceof Error?error.message:'Invalid message.'},{status:400});}
 const now=Date.now(),day=new Date(now).toISOString().slice(0,10),hour=new Date(now).toISOString().slice(0,13),db=e.DB;
 try{await db.prepare('DELETE FROM fx_usage_counters WHERE expires_at < ?').bind(now-86400000).run();await useQuota(db,'visitor:'+await callerHash(request)+':'+hour,12,now+7200000);}catch(error){return Response.json({error:error instanceof Error?error.message:'Usage accounting is unavailable.'},{status:(error as {status?:number})?.status||503});}
 const limit=Math.min(120,Math.max(6,Number(e.FX_MAX_DAILY_CALLS)||60)),cancelled=new AbortController(),signal=AbortSignal.any([request.signal,cancelled.signal]),encoder=new TextEncoder();let open=true;
 const guard=()=>{if(!open||signal.aborted)throw new Error('Message cancelled.');};
 const stream=new ReadableStream({async start(controller){const emit=(event:unknown)=>{if(open)try{controller.enqueue(encoder.encode(JSON.stringify(event)+'\n'));}catch{open=false;cancelled.abort();}};try{await runFxChat(input,{url:e.FX_LLM_BASE_URL,key:e.FX_LLM_API_KEY,model:e.FX_LLM_MODEL,searchKey:e.FX_SEARCH_API_KEY},{emit,signal,beforeModel:async()=>{guard();await useQuota(db,'model:'+day,limit,now+172800000);},beforeSearch:async()=>{guard();await useQuota(db,'search:'+day,60,now+172800000);}});}catch(error){emit({type:'error',message:error instanceof Error?error.message:'Research could not complete. Please try again.'});}finally{if(open){open=false;try{controller.close();}catch{}}}},cancel(){open=false;cancelled.abort();}});
 return new Response(stream,{headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store, no-transform','X-Content-Type-Options':'nosniff'}});
}
