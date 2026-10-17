import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createContext,runInContext} from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
process.env.APP_SECRET='a'.repeat(64);
function load(path,imports={}){
 const source=readFileSync(path,'utf8');
 const js=ts.transpileModule(source,{fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 runInContext(js,createContext({module,exports:module.exports,require:(x)=>imports[x]||require(x),process,Buffer,Date,console,URL,Response,Error,Object,Number,String,Set}),{filename:path});
 return module.exports;
}
const security=load('src/lib/security.ts');
const evento=load('src/lib/evento.ts',{'./db':{query:async()=>{throw Error('DB não esperado');}}});
const qr=load('src/lib/qr.ts',{'./security':security,'./db':{query:async()=>{throw Error('DB não esperado');}}});
const base={ativo:true,qr_tempo_segundos:15,qr_versao:'1',geracao_atividade:'1'};
test('tempo do QR aceita segundos inteiros entre 1 e 3600',()=>{
 for(const t of [1,15,20,30,300,3600])assert.equal(evento.validarTempoQR(t),t);
 for(const t of [0,-1,3601,15.5,'20',null,NaN,Infinity])assert.equal(evento.validarTempoQR(t),null);
});
test('tempo do QR muda o vencimento; tokens antigos perdem a validade quando a versão muda',()=>{
 const at=1660000012000;
 const first=qr.qrCurrent(base,at);
 assert.equal(qr.qrIsValid(first.value,base,at),true);
 const newTime={...base,qr_tempo_segundos:30,qr_versao:'2',qr_inicio_em:new Date(at)};
 const after=qr.qrCurrent(newTime,at);
 assert.notEqual(first.value,after.value);
 assert.equal(qr.qrIsValid(first.value,newTime,at),false);
 assert.equal(qr.qrIsValid(after.value,newTime,after.expiresAt),false);
 assert.equal(after.expiresAt,at+30000);
});
test('desligar a aplicação bloqueia novos cadastros com status HTTP 423',()=>{
 assert.doesNotThrow(()=>evento.exigirEventoAtivo(base));
 assert.throws(()=>evento.exigirEventoAtivo({...base,ativo:false}),err=>err.httpStatus===423);
});
test('sessão de QR emitida antes de desligar e religar é inválida',()=>{
 assert.equal(evento.sessaoDaGeracaoAtual({geracao_atividade:'1'},base),true);
 assert.equal(evento.sessaoDaGeracaoAtual({geracao_atividade:'1'},{...base,geracao_atividade:'2'}),false);
});
test('rotas de escrita usam travamento na mesma transação e respeitam o interruptor',()=>{
 const reg=readFileSync('src/app/api/participantes/route.ts','utf8');
 const update=readFileSync('src/app/api/participantes/[id]/route.ts','utf8');
 const enter=readFileSync('src/app/entrar/route.ts','utf8');
 const pause=readFileSync('src/app/api/sessao/route.ts','utf8');
 const qrRoute=readFileSync('src/app/api/qr/route.ts','utf8');
 const configRoute=readFileSync('src/app/api/admin/config/route.ts','utf8');
 assert.match(reg,/transaction\(async client=>\{\s*const cfg=await bloquearConfiguracao\(client\);\s*exigirEventoAtivo\(cfg\);/);
 assert.match(update,/exigirEventoAtivo\(await bloquearConfiguracao\(client\)\)/);
 assert.match(enter,/bloquearConfiguracao\(client\)/);
 assert.match(pause,/if\(!cfg\.ativo\)return jsonError/);
 assert.match(qrRoute,/if\(!cfg\.ativo\)return Response\.json/);
 assert.match(configRoute,/WHERE id=1 FOR UPDATE/);
 assert.match(configRoute,/geracao_atividade=geracao_atividade\+CASE WHEN \$3 THEN 1/);
});
test('nova migração preserva dados e adiciona campos necessários',()=>{
 const sql=readFileSync('sql/002_controle_evento.sql','utf8');
 assert.match(sql,/CREATE TABLE IF NOT EXISTS configuracoes_evento/);
 assert.match(sql,/ALTER TABLE qr_sessions/);
 assert.match(sql,/ON CONFLICT \(id\) DO NOTHING/);
 assert.doesNotMatch(sql,/DROP TABLE|TRUNCATE|DELETE FROM/);
});

test('POST de participante pelo admin não insere nenhuma linha com sistema desligado',async()=>{
 let inserts=0;
 const route=load('src/app/api/participantes/route.ts',{
  '@/lib/auth':{getAdmin:async()=>({id:7,usuario:'admin'})},
  '@/lib/db':{query:async()=>{throw Error('Consulta inesperada');},transaction:async cb=>cb({query:async()=>{inserts++;throw Error('Não deveria gravar');}})},
  '@/lib/security':{requestOriginAllowed:()=>true,deviceHash:()=>null,jsonError:(mensagem,status)=>Response.json({mensagem},{status}),duplicateMessage:()=>null},
  '@/lib/types':{validarParticipante:()=>({valor:{nome:'Teste',tipo:'visitante',curso:null,periodo:null}})},
  '@/lib/evento':{bloquearConfiguracao:async()=>({...base,ativo:false}),exigirEventoAtivo:evento.exigirEventoAtivo,sessaoDaGeracaoAtual:evento.sessaoDaGeracaoAtual}
 });
 const res=await route.POST({json:async()=>({}),cookies:{get:()=>undefined}});
 assert.equal(res.status,423);
 assert.match((await res.json()).mensagem,/Sistema desligado/);
 assert.equal(inserts,0);
});

test('POST de participante pelo admin grava com sistema ligado',async()=>{
 let inserts=0;
 const route=load('src/app/api/participantes/route.ts',{
  '@/lib/auth':{getAdmin:async()=>({id:7,usuario:'admin'})},
  '@/lib/db':{query:async()=>{throw Error('Consulta inesperada');},transaction:async cb=>cb({query:async(sql)=>{if(sql.includes('INSERT INTO participantes')){inserts++;return {rows:[{id:88,nome:'Teste',tipo:'visitante'}]};}throw Error('Consulta inesperada');}})},
  '@/lib/security':{requestOriginAllowed:()=>true,deviceHash:()=>null,jsonError:(mensagem,status)=>Response.json({mensagem},{status}),duplicateMessage:()=>null},
  '@/lib/types':{validarParticipante:()=>({valor:{nome:'Teste',tipo:'visitante',curso:null,periodo:null}})},
  '@/lib/evento':{bloquearConfiguracao:async()=>base,exigirEventoAtivo:evento.exigirEventoAtivo,sessaoDaGeracaoAtual:evento.sessaoDaGeracaoAtual}
 });
 const res=await route.POST({json:async()=>({}),cookies:{get:()=>undefined}});
 assert.equal(res.status,201);
 assert.equal((await res.json()).id,88);
 assert.equal(inserts,1);
});
