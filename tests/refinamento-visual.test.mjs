import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const from=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const admin=from('src/components/AdminPanel.tsx');
const sidebar=from('src/components/AdminSidebar.tsx');
const login=from('src/components/LoginForm.tsx');
const maintenance=from('src/components/ManutencaoBanco.tsx');
const css=from('src/app/globals.css');

test('ícones vetoriais são renderizados localmente, sem bibliotecas externas novas',()=>{
 const component=from('src/components/DashboardIcon.tsx');
 for(const name of ['graduation','teacher','visitors','database','trash','qr','menu','search','eye'])assert.match(component,new RegExp(`case '${name}'`));
 for(const [filename,source] of [['DashboardIcon.tsx',component],['AdminPanel.tsx',admin],['AdminSidebar.tsx',sidebar],['LoginForm.tsx',login],['ManutencaoBanco.tsx',maintenance]]){
   const output=ts.transpileModule(source,{fileName:filename,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
   assert.equal(output.diagnostics?.length??0,0,`${filename}: ${output.diagnostics?.map(x=>ts.flattenDiagnosticMessageText(x.messageText,' ')).join('; ')}`);
 }
});
test('gráficos mostram distribuição do banco sem porcentagens inventadas',()=>{
 assert.match(admin,/conic-gradient\(\$\{stops\}\)/);
 assert.match(admin,/item\.value\/total\*100/);
 assert.match(admin,/legenda-percentual/);
 assert.match(admin,/grafico-barras-quadro/);
 assert.doesNotMatch(admin,/em relação ao mês anterior|↑ 12%|284 cadastros/);
 assert.ok(admin.indexOf('className="resumo"')<admin.indexOf('className="graficos"'));
});
test('backup e exclusão master ficam nas ações de cadastros recentes',()=>{
 assert.match(admin,/<ManutencaoBanco isGeral=\{isGeral\}/);
 assert.match(maintenance,/if\(!isGeral\)return null/);
 assert.match(maintenance,/DashboardIcon name="database"/);
 assert.match(maintenance,/DashboardIcon name="trash"/);
 assert.match(maintenance,/confirmacao:'EXCLUIR'/);
 assert.match(maintenance,/backupAntes/);
});
test('login acompanha tema azul e permite exibir senha sem mudar autenticação',()=>{
 assert.match(login,/className="login-emblema"/);
 assert.match(login,/setSenhaVisivel/);
 assert.match(login,/\/api\/admin\/login/);
 assert.match(css,/\.tela-login\s*\{[\s\S]*?linear-gradient/);
 assert.match(css,/\.tela-login \.login-entrar/);
 assert.match(admin,/DashboardIcon name="pencil"/);
 assert.match(admin,/DashboardIcon name="trash"/);
 assert.doesNotMatch(admin,/<th>E-mail<\/th>/);
});
