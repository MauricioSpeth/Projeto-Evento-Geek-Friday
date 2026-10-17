import {NextRequest} from 'next/server';
import {registrarPresenca} from '@/lib/auth';
import {adminCookie,jsonError,requestOriginAllowed} from '@/lib/security';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 if(!requestOriginAllowed(request))return jsonError('Origem não autorizada.',403);
 try{
  if(!await registrarPresenca(request.cookies.get(adminCookie)?.value))return jsonError('Sessão não autorizada.',401);
  return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch(error){console.error('Erro ao registrar presença:',error);return jsonError('Falha ao atualizar presença.',500);}
}
