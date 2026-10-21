import {createRequire} from 'node:module';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
const requireTools=createRequire(path.resolve(process.env.UI_TEST_TOOLS||'.test-tools','package.json'));
const {build}=requireTools('esbuild');const {chromium}=requireTools('playwright');
const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Cadastro from './src/components/CadastroForm';import Admin from './src/components/AdminPanel';createRoot(document.getElementById('root')).render(location.pathname==='/admin'?<Admin username="teste" isGeral={false}/>:<Cadastro/>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,jsx:'automatic',tsconfig:'tsconfig.json',plugins:[{name:'navigation-test',setup(b){b.onResolve({filter:/^next\/navigation$/},()=>({path:'nav',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const useRouter=()=>({replace(){},refresh(){}});'}));}}]});
const js=result.outputFiles[0].text;
const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/app.js'?'text/javascript':'text/html');res.end(req.url==='/app.js'?js:'<!doctype html><html lang="pt-BR"><div id="root"></div><script src="/app.js"></script></html>');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;const results=[];
const check=(name,value)=>{assert.ok(value,name);results.push(name);};
try{
 browser=await chromium.launch({channel:process.env.UI_BROWSER_CHANNEL||'msedge',headless:true});
 const context=await browser.newContext();const page=await context.newPage();let sessionStatus=200;
 await page.route('**/api/**',async route=>{
  const url=new URL(route.request().url());let status=200,body={};
  if(url.pathname==='/api/sessao'){status=sessionStatus;body=status===200?{agora:Date.now(),expiraEm:Date.now()+180000}:{mensagem:'Cadastro já realizado.'};}
  else if(url.pathname==='/api/admin/config')body={ativo:true,qr_tempo_segundos:15,qr_versao:'1',geracao_atividade:'1'};
  else if(url.pathname==='/api/participantes')body=route.request().method()==='POST'?{id:1}:[];
  else if(url.pathname==='/api/admins/online')body={administradores:[],online:0};
  else body={online:0};
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 });
 await context.addInitScript(()=>localStorage.setItem('evento_cadastro_feito_neste_aparelho','1'));
 await page.goto(base);await page.locator('#form-cadastro').waitFor();check('Marca antiga não bloqueia sessão válida',await page.locator('#form-cadastro').isVisible());
 sessionStatus=409;await page.getByRole('heading',{name:'Cadastro já realizado'}).waitFor();check('Consulta periódica reconhece cadastro confirmado pelo servidor',true);
 sessionStatus=200;
 await context.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage indisponível');}});});
 await page.goto(base);await page.locator('#cadastro-nome').fill('Teste local');await page.getByRole('button',{name:'Cadastrar',exact:true}).click();await page.getByRole('heading',{name:'Cadastro já realizado'}).waitFor();check('Cadastro funciona com armazenamento local indisponível',true);
 await page.goto(base+'/admin');const trigger=page.getByRole('button',{name:'Novo cadastro',exact:true});await trigger.click();const dialog=page.getByRole('dialog');await dialog.waitFor();
 check('Foco inicial no nome',await page.locator('#admin-form-nome').evaluate(el=>el===document.activeElement));
 await page.keyboard.press('Shift+Tab');check('Shift+Tab mantém foco no diálogo',await page.getByRole('button',{name:'Salvar',exact:true}).evaluate(el=>el===document.activeElement));
 await page.keyboard.press('Tab');check('Tab volta ao primeiro campo',await page.locator('#admin-form-nome').evaluate(el=>el===document.activeElement));
 await page.locator('input[name="admin-form-tipo"]').first().check();await page.locator('#admin-form-curso').click();await page.keyboard.press('Escape');check('Primeiro Escape fecha somente dropdown',await dialog.isVisible()&&await page.getByRole('listbox').count()===0);
 await page.keyboard.press('Escape');check('Escape fecha modal de participante',await dialog.count()===0);check('Foco devolvido ao botão de abertura',await trigger.evaluate(el=>el===document.activeElement));
 const newAdmin=page.getByRole('button',{name:'Novo admin',exact:true});await newAdmin.click();await page.locator('#adminUser').waitFor();check('Foco inicial em novo administrador',await page.locator('#adminUser').evaluate(el=>el===document.activeElement));await page.keyboard.press('Escape');check('Escape fecha modal de administrador',await page.getByRole('dialog').count()===0);check('Foco volta ao botão Novo admin',await newAdmin.evaluate(el=>el===document.activeElement));
 console.log(JSON.stringify({passed:results.length,tests:results},null,2));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
