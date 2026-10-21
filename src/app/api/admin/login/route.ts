import { NextRequest,NextResponse } from 'next/server';
import {query} from '@/lib/db';
import {passwordMatches,requestOriginAllowed,jsonError,hmac} from '@/lib/security';
import {createAdminSession} from '@/lib/auth';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 if(!requestOriginAllowed(request))return jsonError('Origem não autorizada.',403);
 try{
  const body:unknown=await request.json().catch(()=>null);
  if(!body||typeof body!=='object'||Array.isArray(body))return jsonError('Envie um objeto JSON válido.',400);
  const {usuario,senha}=body as Record<string,unknown>;
  if(typeof usuario!=='string'||typeof senha!=='string'||!usuario.trim()||!senha)return jsonError('Informe usuário e senha.',400);
  const usuarioNormalizado=usuario.trim().toLowerCase();
  if(usuario.length>200||usuarioNormalizado.length>40||senha.length>512)return jsonError('Usuário ou senha excedem o tamanho permitido.',400);
  const key=hmac('login-limit',`${request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'desconhecido'}:${usuarioNormalizado}`);
  const attempt=await query<{tentativas:number;bloqueado_ate:Date|null}>(`SELECT tentativas,bloqueado_ate FROM login_attempts WHERE chave=$1`,[key]);
  if(attempt.rows[0]?.bloqueado_ate && new Date(attempt.rows[0].bloqueado_ate).getTime()>Date.now())return jsonError('Muitas tentativas. Tente mais tarde.',429);
  const found=await query<{id:number;usuario:string;senha_hash:string}>(`SELECT id,usuario,senha_hash FROM admins WHERE lower(usuario)=lower($1) LIMIT 1`,[usuarioNormalizado]);
  const admin=found.rows[0];
  // A comparação também é executada com usuário ausente para reduzir diferença de tempo.
  const fake='scrypt$00000000000000000000000000000000$'+ '0'.repeat(128);
  const valid=passwordMatches(senha,admin?.senha_hash||fake);
  if(!admin||!valid){
   await query(`INSERT INTO login_attempts(chave,tentativas,bloqueado_ate)
     VALUES($1,1,NULL) ON CONFLICT(chave) DO UPDATE SET
     tentativas=CASE WHEN login_attempts.atualizado_em < NOW()-INTERVAL '15 minutes' THEN 1 ELSE login_attempts.tentativas+1 END,
     bloqueado_ate=CASE WHEN login_attempts.atualizado_em>=NOW()-INTERVAL '15 minutes' AND login_attempts.tentativas>=4 THEN NOW()+INTERVAL '15 minutes' ELSE NULL END,
     atualizado_em=NOW()`,[key]);
   return jsonError('Usuário ou senha incorretos.',401);
  }
  await query('DELETE FROM login_attempts WHERE chave=$1',[key]);
  const response=NextResponse.json({usuario:admin.usuario});
  await createAdminSession(response,{id:admin.id,usuario:admin.usuario});
  return response;
 }catch(error){console.error('Erro no login:',error);return jsonError('Não foi possível entrar.',500);}
}
