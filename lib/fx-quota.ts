export async function useQuota(db:D1Database,bucket:string,limit:number,expiresAt:number){
 const row=await db.prepare('INSERT INTO fx_usage_counters (bucket, used, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET used = used + 1 WHERE used < ? RETURNING used').bind(bucket,expiresAt,limit).first<{used:number}>();
 if(!row){const error=new Error('The shared demo usage limit has been reached. Please try again after the reset.') as Error & {status?:number};error.status=429;throw error;}
 return row.used;
}
export async function callerHash(request:Request){const day=new Date().toISOString().slice(0,10);const identity=request.headers.get('oai-authenticated-user-id')||request.headers.get('cf-connecting-ip')||'anonymous';const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('fx-demo:'+day+':'+identity));return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,24);}
export function isSameOrigin(request:Request):boolean{
 const origin=request.headers.get('origin');
 if(!origin)return true;
 let reqUrl:URL,origUrl:URL;
 try{reqUrl=new URL(request.url);origUrl=new URL(origin);}catch{return false;}
 if(origUrl.origin===reqUrl.origin)return true;
 const fwdProto=request.headers.get('x-forwarded-proto')?.split(',')[0].trim().toLowerCase();
 const cfVisitor=request.headers.get('cf-visitor')||'';
 const isHttpsProxy=fwdProto==='https'||/"scheme"\s*:\s*"https"/i.test(cfVisitor);
 const fwdHost=request.headers.get('x-forwarded-host')?.split(',')[0].trim().toLowerCase();
 const hostHeader=request.headers.get('host')?.trim().toLowerCase();
 const validHosts=new Set([reqUrl.host.toLowerCase(),hostHeader,fwdHost].filter(Boolean));
 return isHttpsProxy&&origUrl.protocol==='https:'&&validHosts.has(origUrl.host.toLowerCase());
}
