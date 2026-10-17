import {NextRequest} from 'next/server';
import {getAdmin} from '@/lib/auth';
import {query} from '@/lib/db';
import {jsonError,requestOriginAllowed} from '@/lib/security';
export const runtime='nodejs';

export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!requestOriginAllowed(request))return jsonError('Origem não autorizada.',403);
 try{
  const auth=await getAdmin(request);
  if(!auth)return jsonError('Acesso não autorizado.',401);
  if(auth.papel!=='geral'||auth.usuario.toLowerCase()!=='admin')return jsonError('Somente o administrador geral pode excluir administradores.',403);
  const {id:raw}=await params;
  const id=Number(raw);
  if(!Number.isSafeInteger(id)||id<=0)return jsonError('Administrador inválido.',400);
  if(id===auth.id)return jsonError('Você não pode excluir a própria conta.',403);
  // Nunca excluímos uma conta geral por esta rota. Exclusão remove sessões via CASCADE.
  const result=await query<{id:number;usuario:string}>(`DELETE FROM admins WHERE id=$1 AND papel='admin' AND lower(usuario)<>'admin' RETURNING id,usuario`,[id]);
  if(result.rows[0])return Response.json({mensagem:'Administrador excluído.',usuario:result.rows[0].usuario});
  const target=await query<{papel:string}>('SELECT papel FROM admins WHERE id=$1',[id]);
  return target.rows.length?jsonError('A conta de administrador geral não pode ser excluída.',403):jsonError('Administrador não encontrado.',404);
 }catch(error){console.error('Exclusão de administrador:',error);return jsonError('Não foi possível excluir o administrador.',500);}
}
