import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
process.env.APP_SECRET='a'.repeat(64);
function load(path,deps={}){
 const source=fs.readFileSync(path,'utf8');
 const js=ts.transpileModule(source,{fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(js,{module,exports:module.exports,require:(id)=>deps[id]??require(id),Buffer,process,console,Date,Response,Error,Number,JSON},{filename:path});
 return module.exports;
}
const authMaster={id:1,usuario:'admin',papel:'geral'};
const security=load('src/lib/security.ts');
const maintenance=load('src/lib/manutencao.ts',{'./security':security,'./db':{query:async()=>({rows:[]})}});
const jsonError=(mensagem,status)=>Response.json({mensagem},{status});
const req=(body={},admin=authMaster)=>({json:async()=>body,admin});
const checkAuth={getAdmin:async(request)=>request.admin};
const common={'next/server':{},'@/lib/auth':checkAuth,'@/lib/security':{jsonError,requestOriginAllowed:()=>true}};

test('comprovante só é válido para master/dados específicos e expira',()=>{
 const t=maintenance.comprovanteBackup(1,8,20);
 assert.equal(maintenance.conferirComprovante(t,1,8,20),true);
 assert.equal(maintenance.conferirComprovante(t,2,8,20),false);
 assert.equal(maintenance.conferirComprovante(t,1,9,20),false);
 assert.equal(maintenance.conferirComprovante(t,1,8,21),false);
 assert.equal(maintenance.conferirComprovante(t.replace(/.$/,'0'),1,8,20),false);
});

test('backup lógico inclui somente tabelas do App Geek e usa cabeçalhos privados',async()=>{
 const data={admins:[{id:1,usuario:'admin'}],participantes:[{id:1,nome:'Teste'}],dispositivos_cadastrados:[],admin_sessions:[],qr_sessions:[],login_attempts:[],configuracoes_evento:[{id:1,ativo:false}]};
 let queries=[];
 const client={query:async sql=>{queries.push(sql); if(sql.includes('COUNT(*)'))return {rows:[{total:1,ultimo_id:1}]}; const match=/SELECT \* FROM ([a-z_]+)/.exec(sql); if(match)return {rows:data[match[1]]};return {rows:[]};},release:()=>{}};
 const route=load('src/app/api/admin/banco/backup/route.ts',{
  ...common,'@/lib/db':{pool:{connect:async()=>client}},'@/lib/manutencao':{...maintenance,senhaMasterValida:async()=>true}
 });
 assert.equal((await route.POST(req({senha:'x'},{id:2,usuario:'portaria',papel:'admin'}))).status,403);
 const result=await route.POST(req({senha:'correta'}));
 assert.equal(result.status,200);
 const parsed=await result.json();
 assert.equal(parsed.formato,'app-geek-backup');
 assert.deepEqual(Object.keys(parsed.dados).sort(),Object.keys(data).sort());
 assert.equal(parsed.dados.participantes[0].nome,'Teste');
 assert.match(result.headers.get('Cache-Control'),/no-store/);
 assert.ok(result.headers.get('X-Backup-Confirmation'));
 assert.ok(queries.some(q=>q.startsWith('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')));
});

test('limpeza só ocorre com sistema desligado, senha do master e confirmação',async()=>{
 let ativo=true,queries=[],committed=false;
 const client={query:async(sql)=>{queries.push(sql);if(sql.includes('FROM configuracoes_evento WHERE id=1 FOR UPDATE'))return {rows:[{ativo}]};if(sql.includes('COUNT(*)'))return{rows:[{total:2,ultimo_id:8}]};if(sql.startsWith('DELETE FROM'))return{rowCount:2};return{rows:[],rowCount:1};},release:()=>{}};
 const route=load('src/app/api/admin/banco/limpar/route.ts',{
  ...common,'@/lib/db':{pool:{connect:async()=>client}},'@/lib/manutencao':{...maintenance,senhaMasterValida:async()=>true}
 });
 const params={senha:'certa',confirmacao:'EXCLUIR',backupAntes:false,cienteSemBackup:true};
 assert.equal((await route.POST(req(params,{id:9,usuario:'portaria',papel:'admin'}))).status,403);
 assert.equal((await route.POST(req({...params,confirmacao:'sim'}))).status,400);
 assert.equal((await route.POST(req({...params,cienteSemBackup:false}))).status,400);
 assert.equal((await route.POST(req(params))).status,409);
 assert.equal(queries.some(q=>q.startsWith('DELETE FROM')),false,'não apaga quando ativo');
 ativo=false;queries=[];
 const ok=await route.POST(req(params));
 assert.equal(ok.status,200);
 assert.deepEqual((await ok.json()).removidos.participantes,2);
 assert.ok(queries.includes('DELETE FROM participantes'));
 assert.ok(queries.includes('DELETE FROM dispositivos_cadastrados'));
 assert.ok(queries.includes('DELETE FROM qr_sessions'));
 assert.ok(!queries.some(q=>/DELETE FROM admins|TRUNCATE|DROP TABLE/i.test(q)));
 assert.ok(queries.includes('COMMIT'));
});

test('com opção backup obrigatória recusa exclusão sem comprovante',async()=>{
 let removals=0;
 const client={query:async(sql)=>{if(sql.includes('FROM configuracoes_evento WHERE id=1 FOR UPDATE'))return{rows:[{ativo:false}]};if(sql.includes('COUNT(*)'))return{rows:[{total:3,ultimo_id:9}]};if(sql.startsWith('DELETE'))removals++;return{rows:[]};},release:()=>{}};
 const route=load('src/app/api/admin/banco/limpar/route.ts',{
  ...common,'@/lib/db':{pool:{connect:async()=>client}},'@/lib/manutencao':{...maintenance,senhaMasterValida:async()=>true}
 });
 const params={senha:'certa',confirmacao:'EXCLUIR',backupAntes:true};
 assert.equal((await route.POST(req(params))).status,409);
 assert.equal(removals,0);
 const proof=maintenance.comprovanteBackup(1,3,9);
 assert.equal((await route.POST(req({...params,comprovante:proof}))).status,200);
 assert.ok(removals>0);
});

test('os botões aparecem apenas no master e ficam perto dos cadastros recentes',()=>{
 const main=fs.readFileSync('src/components/AdminPanel.tsx','utf8');
 const modal=fs.readFileSync('src/components/ManutencaoBanco.tsx','utf8');
 assert.match(main,/ManutencaoBanco isGeral=\{isGeral\}/);
 assert.match(main,/AdminPanel\(\{username,isGeral\}/);
 assert.match(modal,/if\(!isGeral\)return null/);
 assert.match(modal,/Confirmo que salvei o arquivo/);
 assert.match(modal,/confirmacao!=='EXCLUIR'/);
});
