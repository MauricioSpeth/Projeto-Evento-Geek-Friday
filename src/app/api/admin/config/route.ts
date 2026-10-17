import {NextRequest} from 'next/server';
import {getAdmin} from '@/lib/auth';
import {query,transaction} from '@/lib/db';
import {validarTempoQR,type ConfiguracaoEvento} from '@/lib/evento';
import {jsonError,requestOriginAllowed} from '@/lib/security';

export const runtime='nodejs';
const sqlFields='ativo,qr_tempo_segundos,qr_versao::text AS qr_versao,qr_inicio_em,geracao_atividade::text AS geracao_atividade,atualizado_em,atualizado_por';

export async function GET(request:NextRequest){
 try {
  if(!await getAdmin(request))return jsonError('Acesso não autorizado.',401);
  const result=await query<ConfiguracaoEvento>(`SELECT ${sqlFields} FROM configuracoes_evento WHERE id=1`);
  if(!result.rows[0])return jsonError('Execute npm run db:migrate antes de continuar.',503);
  return Response.json(result.rows[0],{headers:{'Cache-Control':'no-store'}});
 }catch(error){console.error('Leitura das configurações:',error);return jsonError('Falha ao consultar configurações.',500);}
}

export async function PATCH(request:NextRequest){
 if(!requestOriginAllowed(request))return jsonError('Origem não autorizada.',403);
 try{
  const admin=await getAdmin(request);
  if(!admin)return jsonError('Acesso não autorizado.',401);
  const body:unknown=await request.json();
  if(!body||typeof body!=='object'||Array.isArray(body))return jsonError('Envie uma configuração válida.',400);
  const data=body as Record<string,unknown>;
  const keys=Object.keys(data);
  if(keys.length!==1||!['ativo','qr_tempo_segundos'].includes(keys[0]))return jsonError('Altere somente o status ou o tempo de cada vez.',400);
  if(keys[0]==='ativo'&&typeof data.ativo!=='boolean')return jsonError('Estado inválido.',400);
  const tempo=keys[0]==='qr_tempo_segundos'?validarTempoQR(data.qr_tempo_segundos):null;
  if(keys[0]==='qr_tempo_segundos'&&tempo===null)return jsonError('Informe um número inteiro de 1 a 3600 segundos.',400);
  const result=await transaction(async client=>{
   const locked=await client.query<ConfiguracaoEvento>('SELECT ativo,qr_tempo_segundos FROM configuracoes_evento WHERE id=1 FOR UPDATE');
   const old=locked.rows[0];if(!old)throw Error('Execute a migração do banco.');
   const ativo=keys[0]==='ativo' ? data.ativo as boolean : old.ativo;
   const segundos=tempo??old.qr_tempo_segundos;
   const mudouAtivo=ativo!==old.ativo;
   const mudouTempo=segundos!==old.qr_tempo_segundos;
   const novo=await client.query<ConfiguracaoEvento>(`UPDATE configuracoes_evento SET ativo=$1,qr_tempo_segundos=$2,
     qr_versao=qr_versao+CASE WHEN $3 OR $4 THEN 1 ELSE 0 END,
     geracao_atividade=geracao_atividade+CASE WHEN $3 THEN 1 ELSE 0 END,
     qr_inicio_em=CASE WHEN $3 OR $4 THEN NOW() ELSE qr_inicio_em END,
     atualizado_em=NOW(),atualizado_por=$5 WHERE id=1 RETURNING ${sqlFields}`,
    [ativo,segundos,mudouAtivo,mudouTempo,admin.id]);
   return novo.rows[0];
  });
  return Response.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(error){console.error('Atualização das configurações:',error);return jsonError('Não foi possível salvar a configuração.',500);}
}
