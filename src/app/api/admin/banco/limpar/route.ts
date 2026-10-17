import {NextRequest} from 'next/server';
import {getAdmin} from '@/lib/auth';
import {pool} from '@/lib/db';
import {administradorMaster,senhaMasterValida,conferirComprovante,obterContagem} from '@/lib/manutencao';
import {jsonError,requestOriginAllowed} from '@/lib/security';

export const runtime='nodejs';

export async function POST(request:NextRequest){
 if(!requestOriginAllowed(request))return jsonError('Origem não autorizada.',403);
 try{
  const admin=await getAdmin(request);
  if(!admin)return jsonError('Autenticação obrigatória.',401);
  if(!administradorMaster(admin))return jsonError('Somente o master pode limpar os dados do evento.',403);
  const body=await request.json().catch(()=>null) as {
   senha?:unknown;confirmacao?:unknown;backupAntes?:unknown;comprovante?:unknown;cienteSemBackup?:unknown
  }|null;
  if(body?.confirmacao!=='EXCLUIR')return jsonError('Digite EXCLUIR para confirmar a limpeza.',400);
  if(typeof body?.backupAntes!=='boolean')return jsonError('Informe a opção de backup.',400);
  if(body.backupAntes===false && body.cienteSemBackup!==true)
   return jsonError('Confirme que compreende o risco de excluir sem backup.',400);
  if(!await senhaMasterValida(admin,body.senha))return jsonError('Senha do master incorreta.',403);

  const client=await pool.connect();
  try{
   await client.query('BEGIN');
   // Mesmo bloqueio usado pelas inscrições: evita corridas com solicitações públicas.
   const config=await client.query<{ativo:boolean}>('SELECT ativo FROM configuracoes_evento WHERE id=1 FOR UPDATE');
   if(!config.rows[0]){
    await client.query('ROLLBACK');return jsonError('Execute as migrações do banco antes de continuar.',503);
   }
   if(config.rows[0].ativo){
    await client.query('ROLLBACK');return jsonError('Desligue as inscrições no Controle do evento antes de excluir.',409);
   }
   const contagem=await obterContagem(client);
   if(body.backupAntes && !conferirComprovante(body.comprovante,admin.id,contagem.contagem,contagem.ultimoId)){
    await client.query('ROLLBACK');return jsonError('O backup não foi confirmado ou expirou. Baixe um novo antes de excluir.',409);
   }
   // A ordem respeita as FKs. Não há TRUNCATE CASCADE nem exclusão de admins/configuração.
   const sessoes=await client.query('DELETE FROM qr_sessions');
   const dispositivos=await client.query('DELETE FROM dispositivos_cadastrados');
   const participantes=await client.query('DELETE FROM participantes');
   // Preserva ativo/tempo e demais configurações; invalida QR e sessões emitidas antes.
   await client.query(`UPDATE configuracoes_evento SET
      qr_versao=qr_versao+1,geracao_atividade=geracao_atividade+1,
      qr_inicio_em=NOW(),atualizado_em=NOW(),atualizado_por=$1 WHERE id=1`,[admin.id]);
   await client.query('COMMIT');
   return Response.json({mensagem:'Registros do evento removidos.',removidos:{participantes:participantes.rowCount??0,dispositivos:dispositivos.rowCount??0,sessoes_qr:sessoes.rowCount??0}},{headers:{'Cache-Control':'no-store'}});
  }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}
  finally{client.release();}
 }catch(e){console.error('Falha na limpeza dos cadastros:',e);return jsonError('Falha ao limpar os registros. Nenhuma exclusão parcial foi confirmada.',500);}
}
