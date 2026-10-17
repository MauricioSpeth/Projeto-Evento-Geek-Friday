import { cookies } from 'next/headers';
import type { NextRequest,NextResponse } from 'next/server';
import {query} from './db';
import {adminCookie,COOKIE_8H,cookieOptions,hash,token} from './security';
export type Admin={id:number;usuario:string;papel:'admin'|'geral'};
export async function getAdminByToken(value:string|undefined):Promise<Admin|null>{
 if(!value||!/^[a-f0-9]{64}$/.test(value))return null;
 const result=await query<Admin>(`SELECT a.id,a.usuario,a.papel FROM admin_sessions s JOIN admins a ON a.id=s.admin_id
 WHERE s.token_hash=$1 AND s.expira_em>NOW() LIMIT 1`,[hash(value)]);
 return result.rows[0]||null;
}
export async function getAdmin(request:NextRequest){return getAdminByToken(request.cookies.get(adminCookie)?.value);}
export async function getPageAdmin(){const jar=await cookies();return getAdminByToken(jar.get(adminCookie)?.value);}
export async function createAdminSession(response:NextResponse,admin:Pick<Admin,'id'|'usuario'>){
 const raw=token();await query('INSERT INTO admin_sessions(token_hash,admin_id,expira_em) VALUES($1,$2,NOW()+INTERVAL \'8 hours\')',[hash(raw),admin.id]);
 response.cookies.set(adminCookie,raw,cookieOptions(COOKIE_8H));
}
// Registro de presença separado: apenas sessões autenticadas ativas podem sinalizar atividade.
export async function registrarPresenca(raw:string|undefined){
 if(!raw||!/^[a-f0-9]{64}$/.test(raw))return false;
 const result=await query(`UPDATE admin_sessions SET visto_em=NOW() WHERE token_hash=$1 AND expira_em>NOW() RETURNING token_hash`,[hash(raw)]);
 return (result.rowCount??0)>0;
}
export async function revokeSession(raw:string|undefined){if(raw)await query('DELETE FROM admin_sessions WHERE token_hash=$1',[hash(raw)]);}
