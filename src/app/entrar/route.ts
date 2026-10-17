import {NextRequest,NextResponse} from 'next/server';
import {deviceCookie,qrSessionCookie,deviceHash,deviceOptions,deviceValue,token,hash,cookieOptions,getBaseUrl} from '@/lib/security';
import {qrIsValid,SESSION_TTL_MS} from '@/lib/qr';
import {transaction} from '@/lib/db';
import {bloquearConfiguracao} from '@/lib/evento';
export const runtime='nodejs';
function page(message:string,status:number){return new NextResponse(`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><main style="font:18px system-ui;text-align:center;margin:60px auto;max-width:440px"><h1>${message}</h1><p>Procure a organização do evento ou escaneie o QR atual.</p></main>`,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});}
export async function GET(request:NextRequest){
 const qr=request.nextUrl.searchParams.get('t')||'';
 try{
  let current=request.cookies.get(deviceCookie)?.value;
  if(current&&!deviceHash(current))return page('Identificação inválida',403);
  if(!current)current=deviceValue();
  const devHash=deviceHash(current)!;
  const session=token();
  // A geração, a situação do evento e a emissão de sessão compartilham uma
  // transação: desligar o sistema espera esta operação terminar.
  const resultado=await transaction(async client=>{
   const cfg=await bloquearConfiguracao(client);
   if(!cfg.ativo)return 'desligado';
   if(!qrIsValid(qr,cfg))return 'expirado';
   const existente=await client.query('SELECT 1 FROM dispositivos_cadastrados WHERE device_hash=$1 LIMIT 1',[devHash]);
   if(existente.rowCount)return 'duplicado';
   await client.query(`INSERT INTO qr_sessions(token_hash,device_hash,expira_em,usado,geracao_atividade)
     VALUES($1,$2,NOW()+INTERVAL '3 minutes',FALSE,$3)`,[hash(session),devHash,cfg.geracao_atividade]);
   return 'ok';
  });
  if(resultado==='desligado')return page('Inscrições pausadas pela organização',423);
  if(resultado==='expirado')return page('QR Code expirado',410);
  if(resultado==='duplicado'){
   // Mantém o aviso na mesma página/tema do cadastro, sem expor o mecanismo de bloqueio.
   const response=NextResponse.redirect(new URL('/cadastro',getBaseUrl(request)),303);
   response.cookies.set(deviceCookie,current,deviceOptions());
   response.headers.set('Cache-Control','no-store');
   response.headers.set('Referrer-Policy','no-referrer');
   return response;
  }
  const res=NextResponse.redirect(new URL('/cadastro',getBaseUrl(request)),303);
  res.cookies.set(deviceCookie,current,deviceOptions());
  res.cookies.set(qrSessionCookie,session,cookieOptions(Math.ceil(SESSION_TTL_MS/1000)));
  res.headers.set('Cache-Control','no-store');res.headers.set('Referrer-Policy','no-referrer');return res;
 }catch(error){console.error(error);return page('Erro ao validar QR',500);}
}
