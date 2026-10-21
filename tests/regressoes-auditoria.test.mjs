import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
process.env.APP_SECRET='a'.repeat(64);process.env.DEVICE_COOKIE_SECRET='b'.repeat(64);process.env.PUBLIC_URL='https://example.test';
function load(path,deps={}){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,require:id=>deps[id]??require(id),process,Buffer,Date,URL,Response,console:{error(){}}});return m.exports;}
const security=load('src/lib/security.ts');const courses=load('src/lib/cursos.ts');const types=load('src/lib/types.ts',{'./cursos':courses});const qr=load('src/lib/qr.ts',{'./security':security,'./db':{}});
for(const c of courses.CURSOS)for(let p=0;p<=11;p++)test(`curso ${c}, período ${p}`,()=>assert.equal('valor' in types.validarParticipante({nome:'Pessoa Teste',tipo:'aluno',curso:c,periodo:p}),p>=1&&p<=courses.maxPeriodosCurso(c)));
for(const input of [null,[],{},42,'texto',{nome:'',tipo:'visitante'},{nome:' '.repeat(5),tipo:'visitante'},{nome:'x'.repeat(151),tipo:'visitante'},{nome:'Pessoa',tipo:'outro'}])test(`entrada inválida ${JSON.stringify(input).slice(0,60)}`,()=>assert.ok(types.validarParticipante(input).erro));
for(const p of [-1,1.5,11,'1e0',true,null,'01'])test(`período inválido ${p}`,()=>assert.ok(types.validarParticipante({nome:'Pessoa',tipo:'aluno',curso:'Direito',periodo:p}).erro));
for(const raw of [undefined,'','falso','a'.repeat(64),security.deviceValue().slice(0,-1)+'z'])test(`cookie inválido ${String(raw).slice(0,8)}`,()=>assert.equal(security.deviceHash(raw),null));
for(const seconds of [1,15,60,3600])test(`QR bordas ${seconds}s`,()=>{const config={qr_tempo_segundos:seconds,qr_versao:'5',qr_inicio_em:new Date(100000)};const q=qr.qrCurrent(config,100000);assert.equal(qr.qrIsValid(q.value,config,q.expiresAt-1),true);assert.equal(qr.qrIsValid(q.value,config,q.expiresAt),false);assert.equal(qr.qrIsValid(q.value,{...config,qr_versao:'6'},100000),false);});
test('origem externa bloqueada',()=>assert.equal(security.requestOriginAllowed({headers:new Headers({origin:'https://evil.test'}),url:'https://example.test'}),false));
test('origem própria permitida',()=>assert.equal(security.requestOriginAllowed({headers:new Headers({origin:'https://example.test'}),url:'https://example.test'}),true));
test('REGRESSÃO: espaços não devem contornar bloqueio de login',async()=>{
 const attempts=new Map();const selected=[];
 const route=load('src/app/api/admin/login/route.ts',{'next/server':{},'@/lib/security':security,'@/lib/auth':{},'@/lib/db':{query:async(sql,params)=>{
  if(sql.startsWith('SELECT tentativas'))return {rows:attempts.has(params[0])?[attempts.get(params[0])]:[]};
  if(sql.startsWith('SELECT id,usuario')){selected.push(params[0]);return {rows:[]};}
  if(sql.startsWith('INSERT INTO login_attempts')){const n=(attempts.get(params[0])?.tentativas??0)+1;attempts.set(params[0],{tentativas:n,bloqueado_ate:n>=5?new Date(Date.now()+900000):null});return {rows:[]};}
  throw Error(sql);
 }}});
 const request=usuario=>({headers:new Headers({'x-forwarded-for':'192.0.2.1'}),url:'https://example.test/api/admin/login',json:async()=>({usuario,senha:'incorreta'})});
 for(let i=0;i<5;i++)assert.equal((await route.POST(request('teste'))).status,401);
 assert.equal((await route.POST(request('teste'))).status,429);
 assert.equal((await route.POST(request(' teste '))).status,429,'mesma conta normalizada deve continuar bloqueada');
});
test('REGRESSÃO: null no login deve retornar 400',async()=>{
 const route=load('src/app/api/admin/login/route.ts',{'next/server':{},'@/lib/security':security,'@/lib/auth':{},'@/lib/db':{}});
 assert.equal((await route.POST({headers:new Headers(),json:async()=>null})).status,400);
});
test('REGRESSÃO: tipo deve ser string, não array',()=>assert.ok(types.validarParticipante({nome:'Pessoa',tipo:['professor'],curso:'Direito'}).erro));
test('REGRESSÃO: período deve ser escalar, não array',()=>assert.ok(types.validarParticipante({nome:'Pessoa',tipo:'aluno',curso:'Direito',periodo:[1]}).erro));

const event=load('src/lib/evento.ts',{'./db':{}});
for(const [label,config,session,prior,admin,expected] of [
 ['QR válido',true,'valid',false,false,201],
 ['evento pausado público',false,'valid',false,false,423],
 ['evento pausado admin',false,'valid',false,true,423],
 ['sessão inexistente',true,'missing',false,false,403],
 ['sessão expirada',true,'expired',false,false,403],
 ['sessão já utilizada',true,'used',false,false,403],
 ['outro dispositivo',true,'device',false,false,403],
 ['geração anterior',true,'generation',false,false,403],
 ['dispositivo já cadastrado',true,'valid',true,false,409],
 ['admin sem QR',true,'missing',false,true,201],
 ['sem cookies',true,'no-cookie',false,false,403]
])test('POST participante: '+label,async()=>{
 let writes=0;
 const device=security.deviceValue();const dh=security.deviceHash(device);
 const db={query:async()=>({rows:[]}),transaction:async fn=>fn({query:async sql=>{
  if(sql.includes('FROM qr_sessions'))return {rows:session==='missing'?[]:[{device_hash:session==='device'?'outro':dh,usado:session==='used',expira_em:new Date(Date.now()+(session==='expired'?-10000:180000)),geracao_atividade:session==='generation'?'0':'1'}]};
  if(sql.includes('FROM dispositivos_cadastrados'))return {rowCount:prior?1:0,rows:[]};
  if(sql.includes('INSERT INTO participantes')){writes++;return {rows:[{id:1,nome:'Teste',tipo:'visitante'}]};}
  return {rows:[],rowCount:1};
 }})};
 const route=load('src/app/api/participantes/route.ts',{'next/server':{},'@/lib/auth':{getAdmin:async()=>admin?{id:1,usuario:'teste',papel:'admin'}:null},'@/lib/db':db,'@/lib/security':security,'@/lib/types':types,'@/lib/evento':{...event,bloquearConfiguracao:async()=>({ativo:config,geracao_atividade:'1'})}});
 const response=await route.POST({headers:new Headers(),json:async()=>({nome:'Teste',tipo:'visitante'}),cookies:{get:key=>session==='no-cookie'?undefined:{value:key===security.deviceCookie?device:'a'.repeat(64)}}});
 assert.equal(response.status,expected);assert.equal(writes,expected===201?1:0);
});
const exp=load('src/lib/exportacao.ts');
for(const value of ['=1+1','+SUM(A1:A2)','-1+1','@SUM(A1:A2)','  =1','\t=1'])test('CSV neutraliza fórmula '+JSON.stringify(value),()=>assert.ok(exp.campo(value).startsWith('"\'')));
for(const [value,valid] of [[0,false],[1,true],[3600,true],[3601,false],[1.5,false],['15',false],[null,false],[true,false]])test('validade QR configuração '+value,()=>assert.equal(event.validarTempoQR(value)!==null,valid));
for(const [label,body] of [['null',null],['array',[]],['texto','abc'],['vazio',{}],['usuario longo',{usuario:'a'.repeat(201),senha:'abc'}],['senha longa',{usuario:'teste',senha:'a'.repeat(513)}]])test('login rejeita '+label+' antes do banco',async()=>{
 const route=load('src/app/api/admin/login/route.ts',{'next/server':{},'@/lib/security':security,'@/lib/auth':{},'@/lib/db':{query:()=>{throw Error('Não deve acessar banco');}}});
 assert.equal((await route.POST({headers:new Headers(),json:async()=>body})).status,400);
});
test('login rejeita JSON malformado',async()=>{
 const route=load('src/app/api/admin/login/route.ts',{'next/server':{},'@/lib/security':security,'@/lib/auth':{},'@/lib/db':{}});
 assert.equal((await route.POST({headers:new Headers(),json:async()=>{throw new SyntaxError('JSON');}})).status,400);
});
