import {NextRequest} from 'next/server';
import QRCode from 'qrcode';
import {getAdmin} from '@/lib/auth';
import {lerConfiguracao} from '@/lib/evento';
import {qrCurrent} from '@/lib/qr';
import {getBaseUrl,jsonError} from '@/lib/security';
export const runtime='nodejs';
export async function GET(request:NextRequest){
 if(!await getAdmin(request))return jsonError('Acesso não autorizado.',401);
 try{
  const cfg=await lerConfiguracao();
  const agora=Date.now();
  if(!cfg.ativo)return Response.json({ativo:false,tempoSegundos:cfg.qr_tempo_segundos,imagem:null,expiraEm:null,agora},{headers:{'Cache-Control':'no-store'}});
  const qr=qrCurrent(cfg,agora);
  const jaExibido=request.nextUrl.searchParams.get('atual');
  // A tela consulta a cada segundo; só geramos a imagem quando o token mudou.
  const imagem=jaExibido===qr.value?null:await QRCode.toDataURL(`${getBaseUrl(request)}/entrar?t=${qr.value}`);
  return Response.json({ativo:true,tempoSegundos:cfg.qr_tempo_segundos,token:qr.value,imagem,expiraEm:qr.expiresAt,agora},{headers:{'Cache-Control':'no-store'}});
 }catch(error){console.error(error);return jsonError('Não foi possível gerar QR.',500);}
}
