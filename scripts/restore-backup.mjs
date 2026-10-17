/** Restaura somente para um banco NOVO e VAZIO, após npm run db:migrate.
 *  Uso: node scripts/restore-backup.mjs caminho/do/backup.json --confirm-restore
 *  Nunca execute apontando para o banco de produção do evento.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import dotenv from 'dotenv';
import pg from 'pg';
import {poolOptions} from './pg-config.mjs';

dotenv.config({path:path.resolve(process.cwd(),'.env.local'),override:true});
const tabelaOrdem=['admins','participantes','dispositivos_cadastrados','admin_sessions','qr_sessions','login_attempts','configuracoes_evento'];
const [arquivo,confirmacao]=process.argv.slice(2);
if(!arquivo||confirmacao!=='--confirm-restore'){
 console.error('Uso: node scripts/restore-backup.mjs <backup.json> --confirm-restore');
 process.exit(1);
}
const backup=JSON.parse(fs.readFileSync(arquivo,'utf8'));
if(backup.formato!=='app-geek-backup'||backup.versao!==1||!backup.dados||
 Object.keys(backup.dados).sort().join('|')!==[...tabelaOrdem].sort().join('|')||
 tabelaOrdem.some(t=>!Array.isArray(backup.dados[t]))){
 throw new Error('Arquivo de backup inválido ou incompatível.');
}
const digest=createHash('sha256').update(JSON.stringify(backup.dados)).digest('hex');
if(digest!==backup.sha256_dados)throw new Error('Integridade do backup inválida. Arquivo alterado ou corrompido.');
const pool=new pg.Pool(poolOptions());
const client=await pool.connect();
try{
 await client.query('BEGIN');
 await client.query('LOCK TABLE '+tabelaOrdem.join(', ')+' IN ACCESS EXCLUSIVE MODE');
 for(const t of tabelaOrdem){
  const {rows}=await client.query(`SELECT COUNT(*)::integer AS n FROM ${t}`);
  // configuracoes_evento contém o registro id=1 criado pelas migrações.
  if(rows[0].n>(t==='configuracoes_evento'?1:0))throw new Error(`O banco de destino não está vazio (${t}). Use um banco de testes novo.`);
 }
 await client.query('DELETE FROM configuracoes_evento');
 for(const t of tabelaOrdem){
  for(const row of backup.dados[t]){
   if(!row||typeof row!=='object'||Array.isArray(row))throw new Error(`Linha inválida em ${t}`);
   const keys=Object.keys(row);
   if(!keys.length)continue;
   for(const k of keys){if(!/^[a-z_][a-z0-9_]*$/.test(k))throw new Error('Nome de coluna inválido no backup.');}
   const nomes=keys.map(k=>`"${k}"`).join(',');
   const vals=keys.map((_,i)=>`$${i+1}`).join(',');
   const override=t==='admins'||t==='participantes'?' OVERRIDING SYSTEM VALUE':'';
   await client.query(`INSERT INTO ${t} (${nomes})${override} VALUES (${vals})`,keys.map(k=>row[k]));
  }
 }
 for(const t of ['admins','participantes']){
  const {rows}=await client.query(`SELECT MAX(id)::integer AS max FROM ${t}`);
  if(rows[0].max!==null)await client.query(`SELECT setval(pg_get_serial_sequence($1,'id'),$2,true)`,[t,rows[0].max]);
 }
 await client.query('COMMIT');
 console.log('Backup restaurado no banco de testes. Não inicie a aplicação antes de revisar os dados.');
}catch(e){await client.query('ROLLBACK').catch(()=>{});console.error('Restauração cancelada:',e.message);process.exitCode=1;}
finally{client.release();await pool.end();}
