import { NextRequest } from 'next/server';
import {getAdmin} from '@/lib/auth';
import {query} from '@/lib/db';
import {passwordHash,requestOriginAllowed,jsonError,duplicateMessage} from '@/lib/security';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 if(!requestOriginAllowed(request))return jsonError('Origem não autorizada.',403);
 const admin=await getAdmin(request);if(!admin)return jsonError('Acesso não autorizado.',401);
 try{
  const {usuario,senha}=await request.json();
  if(typeof usuario!=='string'||!/^[A-Za-z0-9._-]{3,40}$/.test(usuario))return jsonError('Nome de usuário inválido (3 a 40 caracteres).',400);
  if(typeof senha!=='string'||senha.length<12)return jsonError('A senha precisa ter ao menos 12 caracteres.',400);
  const result=await query('INSERT INTO admins(usuario,senha_hash) VALUES($1,$2) RETURNING id,usuario,criado_em',[usuario,passwordHash(senha)]);
  return Response.json(result.rows[0],{status:201});
 }catch(error){if(duplicateMessage(error))return jsonError('Já existe esse administrador.',409);console.error(error);return jsonError('Erro ao criar administrador.',500);}
}

// Somente o administrador geral pode listar as contas do painel.
export async function GET(request:NextRequest){
 try{
  const admin=await getAdmin(request);
  if(!admin)return jsonError('Acesso não autorizado.',401);
  if(admin.papel!=='geral'||admin.usuario.toLowerCase()!=='admin')return jsonError('Apenas o administrador geral tem acesso.',403);
  const result=await query('SELECT id,usuario,papel,criado_em FROM admins ORDER BY criado_em,id');
  return Response.json(result.rows,{headers:{'Cache-Control':'private, no-store'}});
 }catch(error){console.error('Listagem de admins:',error);return jsonError('Falha ao consultar administradores.',500);}
}
