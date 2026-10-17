import {NextRequest} from 'next/server';
import {getAdmin} from '@/lib/auth';
export const runtime='nodejs';
export async function GET(request:NextRequest){const admin=await getAdmin(request);return Response.json(admin?{autenticado:true,usuario:admin.usuario}:{autenticado:false},{status:admin?200:401,headers:{'Cache-Control':'no-store'}});}
