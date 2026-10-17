import { createHash, timingSafeEqual } from 'node:crypto';
import type { PoolClient } from 'pg';
import {query} from './db';
import {hmac,passwordMatches} from './security';
import type {Admin} from './auth';

// Somente tabelas criadas pelas migrações do App Geek (sem acessar outras tabelas do Supabase).
export const TABELAS_APP = [
 'admins', 'participantes', 'dispositivos_cadastrados', 'admin_sessions',
 'qr_sessions', 'login_attempts', 'configuracoes_evento'
] as const;
export type TabelaApp = typeof TABELAS_APP[number];
export type BackupApp = {
 formato: 'app-geek-backup'; versao: 1; gerado_em: string;
 observacao: string; dados: Record<TabelaApp,Record<string,unknown>[]>;
 sha256_dados: string;
};

export function administradorMaster(admin:Admin|null):admin is Admin {
 return !!admin && admin.papel === 'geral' && admin.usuario.toLowerCase()==='admin';
}

export async function senhaMasterValida(admin:Admin,senha:unknown):Promise<boolean> {
 const chave=hmac('maintenance-password-limit',String(admin.id));
 const tentativa=await query<{bloqueado_ate:Date|null}>(
  'SELECT bloqueado_ate FROM login_attempts WHERE chave=$1',[chave]);
 if(tentativa.rows[0]?.bloqueado_ate && new Date(tentativa.rows[0].bloqueado_ate).getTime()>Date.now())return false;
 const resultado=await query<{senha_hash:string}>(
  `SELECT senha_hash FROM admins WHERE id=$1 AND papel='geral' AND lower(usuario)='admin'`,[admin.id]);
 const valida=typeof senha==='string'&&senha.length>0&&senha.length<=512&&
  !!resultado.rows[0]&&passwordMatches(senha,resultado.rows[0].senha_hash);
 if(valida){await query('DELETE FROM login_attempts WHERE chave=$1',[chave]);return true;}
 await query(`INSERT INTO login_attempts(chave,tentativas,bloqueado_ate)
   VALUES($1,1,NULL) ON CONFLICT(chave) DO UPDATE SET
   tentativas=CASE WHEN login_attempts.atualizado_em < NOW()-INTERVAL '15 minutes' THEN 1 ELSE login_attempts.tentativas+1 END,
   bloqueado_ate=CASE WHEN login_attempts.atualizado_em >= NOW()-INTERVAL '15 minutes' AND login_attempts.tentativas>=4
    THEN NOW()+INTERVAL '15 minutes' ELSE NULL END,
   atualizado_em=NOW()`,[chave]);
 return false;
}

export function sha256(value:string){return createHash('sha256').update(value).digest('hex');}

export function comprovanteBackup(adminId:number,contagem:number,ultimoId:number){
 const dados=Buffer.from(JSON.stringify({a:adminId,c:contagem,i:ultimoId,t:Date.now()})).toString('base64url');
 return `${dados}.${hmac('backup-concluido',dados)}`;
}

export function conferirComprovante(value:unknown,adminId:number,contagem:number,ultimoId:number){
 if(typeof value!=='string'||value.length>512)return false;
 const match=/^([A-Za-z0-9_-]+)\.([a-f0-9]{64})$/.exec(value);
 if(!match)return false;
 const esperado=Buffer.from(hmac('backup-concluido',match[1]),'hex');
 const recebido=Buffer.from(match[2],'hex');
 if(!timingSafeEqual(esperado,recebido))return false;
 try{
  const p=JSON.parse(Buffer.from(match[1],'base64url').toString('utf8')) as {a?:number;c?:number;i?:number;t?:number};
  return p.a===adminId&&p.c===contagem&&p.i===ultimoId&&typeof p.t==='number'&&
   p.t<=Date.now()&&p.t>Date.now()-10*60_000;
 }catch{return false;}
}

export async function obterContagem(client:PoolClient){
 const r=await client.query<{total:number;ultimo_id:number}>(
  'SELECT COUNT(*)::integer AS total, COALESCE(MAX(id),0)::integer AS ultimo_id FROM participantes');
 return {contagem:r.rows[0].total,ultimoId:r.rows[0].ultimo_id};
}

export async function extrairBackup(client:PoolClient):Promise<BackupApp>{
 const dados={} as Record<TabelaApp,Record<string,unknown>[]>;
 for(const tabela of TABELAS_APP){
  // Interpolação restrita a nomes constantes definidos no código, nunca entrada do usuário.
  const resultado=await client.query<Record<string,unknown>>(`SELECT * FROM ${tabela}`);
  dados[tabela]=resultado.rows;
 }
 return {
  formato:'app-geek-backup',versao:1,gerado_em:new Date().toISOString(),
  observacao:'Backup lógico das tabelas do App Geek. Contém dados pessoais, hashes e sessões. Guardar em local privado. Restaurar usando scripts/restore-backup.mjs sobre um banco de testes vazio.',
  dados,sha256_dados:sha256(JSON.stringify(dados))
 };
}
