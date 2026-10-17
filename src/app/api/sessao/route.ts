import {NextRequest} from 'next/server';
import {deviceHash,deviceCookie,qrSessionCookie,jsonError} from '@/lib/security';
import {qrSessionByToken,deviceAlreadyRegistered} from '@/lib/qr';
import {lerConfiguracao,sessaoDaGeracaoAtual} from '@/lib/evento';
export const runtime='nodejs';
export async function GET(request:NextRequest){
 try {
  const cfg=await lerConfiguracao();
  if(!cfg.ativo)return jsonError('Inscrições pausadas pela organização.',423);
  const devHash=deviceHash(request.cookies.get(deviceCookie)?.value);
  if(!devHash)return jsonError('Escaneie o QR do evento para acessar.',403);
  if(await deviceAlreadyRegistered(devHash))return jsonError('Cadastro já realizado.',409);
  const session=await qrSessionByToken(request.cookies.get(qrSessionCookie)?.value);
  if(!session||session.device_hash!==devHash||session.usado||!sessaoDaGeracaoAtual(session,cfg)||new Date(session.expira_em).getTime()<=Date.now())return jsonError('Sessão inválida ou expirada. Escaneie novamente.',403);
  return Response.json({expiraEm:new Date(session.expira_em).getTime(),agora:Date.now()},{headers:{'Cache-Control':'no-store'}});
 }catch(error){console.error(error);return jsonError('Não foi possível verificar a sessão.',500);}
}
