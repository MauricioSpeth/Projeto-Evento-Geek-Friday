import {NextRequest,NextResponse} from 'next/server';
import {getAdmin,revokeSession} from '@/lib/auth';
import {adminCookie,cookieOptions,requestOriginAllowed,jsonError} from '@/lib/security';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 if(!requestOriginAllowed(request))return jsonError('Origem não autorizada.',403);
 const admin=await getAdmin(request);if(!admin)return jsonError('Acesso não autorizado.',401);
 await revokeSession(request.cookies.get(adminCookie)?.value);
 const response=NextResponse.json({mensagem:'Sessão encerrada.'});response.cookies.set(adminCookie,'',{...cookieOptions(0),maxAge:0});return response;
}
