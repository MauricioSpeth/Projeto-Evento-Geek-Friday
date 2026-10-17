import {NextRequest} from 'next/server';
import {getAdmin} from '@/lib/auth';
import {query,transaction} from '@/lib/db';
import {bloquearConfiguracao,exigirEventoAtivo} from '@/lib/evento';
import {validarParticipante,type Participante} from '@/lib/types';
import {requestOriginAllowed,jsonError,duplicateMessage} from '@/lib/security';
export const runtime='nodejs';
type Ctx={params:Promise<{id:string}>};
async function access(request:NextRequest,ctx:Ctx){const admin=await getAdmin(request);const id=Number((await ctx.params).id);return {admin,id};}
export async function GET(request:NextRequest,ctx:Ctx){
 try {const {admin,id}=await access(request,ctx);if(!admin)return jsonError('Acesso não autorizado.',401);if(!Number.isSafeInteger(id)||id<1)return jsonError('ID inválido.',400);
  const result=await query<Participante>('SELECT * FROM participantes WHERE id=$1',[id]);return result.rows[0]?Response.json(result.rows[0]):jsonError('Participante não encontrado.',404);
 }catch(error){console.error(error);return jsonError('Erro ao buscar participante.',500);}
}
export async function PUT(request:NextRequest,ctx:Ctx){
 if(!requestOriginAllowed(request))return jsonError('Origem não autorizada.',403);
 try{const {admin,id}=await access(request,ctx);if(!admin)return jsonError('Acesso não autorizado.',401);if(!Number.isSafeInteger(id)||id<1)return jsonError('ID inválido.',400);
  const v=validarParticipante(await request.json());if('erro' in v)return jsonError(v.erro,400);
  const {nome,tipo,curso,periodo}=v.valor;
  const result=await transaction(async client=>{
   exigirEventoAtivo(await bloquearConfiguracao(client));
   return client.query<Participante>(`UPDATE participantes SET nome=$1,tipo=$2,curso=$3,periodo=$4 WHERE id=$5 RETURNING *`,[nome,tipo,curso,periodo,id]);
  });
  return result.rows[0]?Response.json(result.rows[0]):jsonError('Participante não encontrado.',404);
 }catch(error){const duplicate=duplicateMessage(error);if(duplicate)return jsonError(duplicate,409);const e=error as {httpStatus?:number;message?:string};if(e.httpStatus)return jsonError(e.message||'Sistema desligado.',e.httpStatus);console.error(error);return jsonError('Erro ao editar participante.',500);}
}
export async function DELETE(request:NextRequest,ctx:Ctx){
 if(!requestOriginAllowed(request))return jsonError('Origem não autorizada.',403);
 try{const {admin,id}=await access(request,ctx);if(!admin)return jsonError('Acesso não autorizado.',401);if(!Number.isSafeInteger(id)||id<1)return jsonError('ID inválido.',400);
  const result=await transaction(async client=>{
   exigirEventoAtivo(await bloquearConfiguracao(client));
   return client.query<Participante>('DELETE FROM participantes WHERE id=$1 RETURNING *',[id]);
  });return result.rows[0]?Response.json({mensagem:'Participante excluído.',participante:result.rows[0]}):jsonError('Participante não encontrado.',404);
 }catch(error){const e=error as {httpStatus?:number;message?:string};if(e.httpStatus)return jsonError(e.message||'Sistema desligado.',e.httpStatus);console.error(error);return jsonError('Erro ao excluir.',500);}
}
