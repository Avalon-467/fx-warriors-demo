import {cleanText} from './fx-tools.mjs';

export function publicUrl(value){
 try{const url=new URL(value);const host=url.hostname.toLowerCase();
  if(url.protocol!=='https:'||url.username||url.password||url.port||!host.includes('.')||host.includes(':')||/^\d+(?:\.\d+)*$/.test(host)||/(^|\.)(localhost|local|internal|test|invalid)$/.test(host)||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal'))return null;
  url.hash='';return url.toString();
 }catch{return null;}
}
async function tavily(path,body,{fetchImpl=fetch,key,signal,beforeSearch=()=>{}}={}){
 await beforeSearch();
 const headers={'Content-Type':'application/json','X-Client-Source':'fx-warriors'};
 if(key)headers.Authorization='Bearer '+key;else headers['X-Tavily-Access-Mode']='keyless';
 const timeout=AbortSignal.timeout(20000);
 const response=await fetchImpl('https://api.tavily.com/'+path,{method:'POST',headers,body:JSON.stringify(body),signal:signal?AbortSignal.any([signal,timeout]):timeout,redirect:'manual'});
 if(!response.ok){if([429,432,433].includes(response.status))throw new Error('Web search is temporarily rate limited. Please try again later.');throw new Error('Web research service returned HTTP '+response.status+'.');}
 const data=await response.json();if(!Array.isArray(data.results))throw new Error('The search provider did not return usable results.');return data;
}
export async function searchWeb(args,options={}){
 const query=typeof args?.query==='string'?args.query.trim():'';
 if(!query||query.length>300)throw new Error('Search query must contain 1–300 characters.');
 const topic=['general','news'].includes(args.topic)?args.topic:'general';
 const body={query,topic,max_results:5,search_depth:'basic',include_answer:false,include_raw_content:false,include_published_date:true,safe_search:true};
 if(['week','month','year'].includes(args.time_range))body.time_range=args.time_range;
 const data=await tavily('search',body,options),seen=new Set(),sources=[];
 for(const item of data.results){const url=publicUrl(item.url);if(!url||seen.has(url))continue;seen.add(url);sources.push({url,title:cleanText(item.title).slice(0,240)||new URL(url).hostname,publisher:new URL(url).hostname.replace(/^www\./,''),summary:cleanText(item.content).slice(0,2000),published_at:item.published_date||null,retrieved_at:new Date().toISOString(),evidence_scope:'Search excerpt; full page has not been read.',retrieval_mode:'web_search'});}
 return {query,provider:'Tavily',sources:sources.slice(0,5),notice:sources.length?null:'No usable web results were returned for this query.'};
}
export async function readSource(source,options={}){
 const url=publicUrl(source?.url);if(!url)throw new Error('Choose a valid source returned by a research tool.');
 const data=await tavily('extract',{urls:[url],extract_depth:'basic',format:'text'},options);
 const item=data.results.find(item=>publicUrl(item.url)===url);
 if(!item?.raw_content)throw new Error('This page could not be read. Its search excerpt remains available.');
 return {...source,summary:String(item.raw_content).replace(/\u0000/g,'').slice(0,8000),evidence_scope:'Extracted page excerpt, limited to 8,000 characters; may omit parts of the page.',retrieval_mode:'page_excerpt',retrieved_at:new Date().toISOString()};
}
