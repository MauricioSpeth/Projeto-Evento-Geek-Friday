import {NextRequest} from 'next/server';
import {getAdmin} from '@/lib/auth';
import {query} from '@/lib/db';
import {consulta,gerarCSV,nomeArquivo,type LinhaParticipante,type TipoExportacao} from '@/lib/exportacao';
import {jsonError} from '@/lib/security';
export const runtime='nodejs';
export const dynamic='force-dynamic';

// Exportações são somente leitura e continuam disponíveis após desligar o evento.
export async function GET(request:NextRequest,{params}:{params:Promise<{tipo:string}>}){
 try{
  if(!await getAdmin(request))return jsonError('Acesso não autorizado.',401);
  const {tipo}=await params;
  const filtro=consulta(tipo);
  if(!filtro)return jsonError('Exportação não encontrada.',404);
  const resultado=await query<LinhaParticipante>(filtro.sql,filtro.params);
  return new Response(gerarCSV(resultado.rows),{status:200,headers:{
   'Content-Type':'text/csv; charset=utf-8',
   'Content-Disposition':`attachment; filename="${nomeArquivo(tipo as TipoExportacao)}"`,
   'Cache-Control':'private, no-store, max-age=0',
   'X-Content-Type-Options':'nosniff'
  }});
 }catch(error){console.error('Erro ao exportar cadastros:',error);return jsonError('Erro ao exportar cadastros.',500);}
}
