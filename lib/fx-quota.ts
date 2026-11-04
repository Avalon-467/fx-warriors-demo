export async function useQuota(db:D1Database,bucket:string,limit:number,expiresAt:number){
 const row=await db.prepare('INSERT INTO fx_usage_counters (bucket, used, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET used = used + 1 WHERE used < ? RETURNING used').bind(bucket,expiresAt,limit).first<{used:number}>();
 if(!row){const error=new Error('The shared demo usage limit has been reached. Please try again after the reset.') as Error & {status?:number};error.status=429;throw error;}
 return row.used;
}
export async function callerHash(request:Request){const day=new Date().toISOString().slice(0,10);const identity=request.headers.get('oai-authenticated-user-id')||request.headers.get('cf-connecting-ip')||'anonymous';const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('fx-demo:'+day+':'+identity));return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,24);}
