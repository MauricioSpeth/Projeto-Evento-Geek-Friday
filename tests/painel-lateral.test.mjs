import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
function load(path,dependencies={}){
 const result=ts.transpileModule(fs.readFileSync(path,'utf8'),{fileName:path,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}});
 const failures=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
 assert.equal(failures.length,0,'TS syntax: '+failures.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; '));
 const module={exports:{}};
 const globals={module,exports:module.exports,require:(id)=>dependencies[id]??require(id),console,Buffer,process,Response};
 vm.runInNewContext(result.outputText,globals,{filename:path});
 return module.exports;
}
test('rota de lista de online exige sessão; agrupa pelo administrador, nunca por aba',async()=>{
 let sql='';const route=load('src/app/api/admins/online/route.ts',{
  'next/server':{},'@/lib/auth':{getAdmin:async req=>req.allow?{id:1,usuario:'admin',papel:'geral'}:null},
  '@/lib/db':{query:async q=>{sql=q;return {rows:[{id:1,usuario:'admin',papel:'geral'}]};}},
  '@/lib/security':{jsonError:(message,status)=>Response.json({message},{status})}
 });
 assert.equal((await route.GET({allow:false})).status,401);
 const ok=await route.GET({allow:true});assert.equal(ok.status,200);
 const data=await ok.json();assert.equal(data.online,1);assert.equal(data.administradores[0].usuario,'admin');
 assert.match(sql,/GROUP BY a.id/);assert.match(sql,/visto_em > NOW\(\)/);assert.match(sql,/expira_em > NOW\(\)/);
 assert.match(ok.headers.get('Cache-Control'),/no-store/);
});
test('apenas o master admin pode excluir contas de outros administradores',async()=>{
 let removals=0;
 const route=load('src/app/api/admins/[id]/route.ts',{
  'next/server':{},
  '@/lib/auth':{getAdmin:async r=>r.admin},
  '@/lib/db':{query:async sql=>{if(sql.includes('DELETE FROM admins')){removals++;return {rows:[{id:9,usuario:'portaria'}]};}return{rows:[]};}},
  '@/lib/security':{requestOriginAllowed:()=>true,jsonError:(mensagem,status)=>Response.json({mensagem},{status})}
 });
 const options={params:Promise.resolve({id:'9'})};
 assert.equal((await route.DELETE({admin:{id:1,usuario:'operador',papel:'geral'}},options)).status,403);
 assert.equal((await route.DELETE({admin:{id:2,usuario:'portaria',papel:'admin'}},options)).status,403);
 assert.equal(removals,0);
 assert.equal((await route.DELETE({admin:{id:1,usuario:'admin',papel:'geral'}},{params:Promise.resolve({id:'1'})})).status,403);
 assert.equal((await route.DELETE({admin:{id:1,usuario:'admin',papel:'geral'}},options)).status,200);
 assert.equal(removals,1);
});
test('o layout aprovado tem menu ☰, ações apenas na lateral e 3 nomes com rolagem',()=>{
 const main=fs.readFileSync('src/components/AdminPanel.tsx','utf8');
 const menu=fs.readFileSync('src/components/AdminSidebar.tsx','utf8');
 const css=fs.readFileSync('src/app/globals.css','utf8');
 assert.match(main,/aria-label=\{lateralAberta\?'Fechar menu/);
 assert.match(main,/<AdminSidebar /);
 assert.doesNotMatch(main,/<th>E-mail<\/th>/);
 assert.match(menu,/Admins online/);
 assert.match(menu,/\/api\/admins\/online/);
 assert.match(menu,/Abrir QR Code/);
 assert.match(menu,/Novo cadastro/);
 assert.match(menu,/Novo admin/);
 assert.match(menu,/isGeral && conta.papel==='admin'/);
 assert.match(css,/\.lateral-online-scroll\s*\{[^}]*height:207px;overflow-y:auto/s);
});
