import {NextRequest} from 'next/server';
import {getAdmin} from '@/lib/auth';
import {pool} from '@/lib/db';
import {administradorMaster,senhaMasterValida,extrairBackup,comprovanteBackup,obterContagem} from '@/lib/manutencao';
import {jsonError,requestOriginAllowed} from '@/lib/security';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request:NextRequest){
 if(!requestOriginAllowed(request))return jsonError('Origem não autorizada.',403);
 try{
  const admin=await getAdmin(request);
  if(!admin)return jsonError('Autenticação obrigatória.',401);
  if(!administradorMaster(admin))return jsonError('Somente o administrador master pode baixar este backup.',403);
  const body=await request.json().catch(()=>null) as {senha?:unknown}|null;
  if(!await senhaMasterValida(admin,body?.senha))return jsonError('Senha do master incorreta.',403);
  const client=await pool.connect();
  try{
   await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
   const contagem=await obterContagem(client);
   const arquivo=await extrairBackup(client);
   await client.query('COMMIT');
   const conteudo=JSON.stringify(arquivo,null,2);
   if(Buffer.byteLength(conteudo,'utf8')>20*1024*1024)
    return jsonError('Backup acima de 20 MB. Para bancos maiores, use o pg_dump diretamente no PostgreSQL.',413);
   const data=new Date().toISOString().slice(0,10);
   return new Response(conteudo,{
    headers:{
     'Content-Type':'application/json; charset=utf-8',
     'Content-Disposition':`attachment; filename="app-geek-backup-${data}.json"`,
     'Cache-Control':'private, no-store, max-age=0',
     'Pragma':'no-cache',
     'X-Content-Type-Options':'nosniff',
     'X-Backup-Confirmation':comprovanteBackup(admin.id,contagem.contagem,contagem.ultimoId)
    }
   });
  }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}
  finally{client.release();}
 }catch(e){console.error('Falha ao exportar backup do App Geek:',e);return jsonError('Falha ao gerar backup.',500);}
}
