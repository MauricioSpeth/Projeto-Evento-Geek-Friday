import {query} from '@/lib/db';
export const runtime='nodejs';
export const dynamic='force-dynamic';

// Endpoint público: somente total, sem identidades, e sem cache de CDN.
export async function GET(){
 try{
  const result=await query<{total:number}>(`SELECT COUNT(DISTINCT admin_id)::int AS total
    FROM admin_sessions WHERE expira_em>NOW() AND visto_em>NOW()-INTERVAL '90 seconds'`);
  return Response.json({online:result.rows[0]?.total??0},{headers:{'Cache-Control':'no-store, max-age=0'}});
 }catch(error){console.error('Erro ao consultar administradores online:',error);return Response.json({mensagem:'Presença indisponível.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
