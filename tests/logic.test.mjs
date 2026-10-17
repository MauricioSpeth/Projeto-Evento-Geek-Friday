import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {createContext,runInContext} from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
process.env.APP_SECRET='a'.repeat(64);
function load(file,imports={}){
 const source=fs.readFileSync(file,'utf8');
 const js=ts.transpileModule(source,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const module={exports:{}};
 const context=createContext({module,exports:module.exports,process,Buffer,Date,URL,console,require:(id)=>imports[id]||require(id)});
 runInContext(js,context,{filename:file});return module.exports;
}
const root=process.cwd();const security=load(`${root}/src/lib/security.ts`);
const courses=load(`${root}/src/lib/cursos.ts`);
const types=load(`${root}/src/lib/types.ts`,{'./cursos':courses});
const qr=load(`${root}/src/lib/qr.ts`,{'./security':security,'./db':{query:async()=>{throw Error('não esperado')}}});
test('hash de senha e verificação scrypt',()=>{
 const stored=security.passwordHash('senha-de-teste-longa');assert.equal(security.passwordMatches('senha-de-teste-longa',stored),true);assert.equal(security.passwordMatches('incorreta',stored),false);
});
test('cookie assinado identifica apenas o navegador certo',()=>{
 const cookie=security.deviceValue();const fingerprint=security.deviceHash(cookie);
 assert.equal(typeof fingerprint,'string');assert.equal(fingerprint.length,64);const adulterado=cookie.slice(0,-1)+(cookie.endsWith('0')?'1':'0');assert.equal(security.deviceHash(adulterado)===fingerprint,false);assert.equal(security.deviceHash('fake'),null);
});
test('cookies e hashes herdados do Express são preservados na migração',()=>{
 const id='f'.repeat(64),cookie=`${id}.${security.deviceValue(id).split('.')[1]}`;
 const legacyHash=require('node:crypto').createHmac('sha256',process.env.APP_SECRET).update(`db:${id}`).digest('hex');
 assert.equal(security.deviceHash(cookie),legacyHash);
});
test('QR é válido por janelas de 15 segundos',()=>{
 const now=1650000000000,config={qr_tempo_segundos:15,qr_versao:'1'};
 const first=qr.qrCurrent(config,now),second=qr.qrCurrent(config,now+1000);
 assert.equal(first.value,second.value);assert.equal(qr.qrIsValid(first.value,config,now),true);assert.equal(qr.qrIsValid(first.value,config,first.expiresAt),false);
});
test('tipos de cadastro e validação de período',()=>{
 const v=types.validarParticipante({nome:'  Maria  Silva ',tipo:'aluno',curso:'Engenharia de Software',periodo:5});
 assert.equal(v.valor.nome,'Maria Silva');assert.equal(v.valor.periodo,5);
 assert.ok(types.validarParticipante({nome:'Maria',tipo:'aluno',curso:'Direito',periodo:11}).erro);
 assert.deepEqual(JSON.parse(JSON.stringify(types.validarParticipante({nome:'Maria',tipo:'visitante'}).valor)),{nome:'Maria',tipo:'visitante',curso:null,periodo:null});
 assert.equal(types.validarParticipante({nome:'João',tipo:'professor',curso:'Administração'}).valor.periodo,null);
});
test('regras importantes migradas: lock no QR e conflito PostgreSQL',()=>{
 const post=fs.readFileSync('src/app/api/participantes/route.ts','utf8');
 const sql=fs.readFileSync('sql/001_schema_nextjs.sql','utf8');
 assert.match(post,/FOR UPDATE/);assert.match(post,/transaction\(/);assert.match(post,/INSERT INTO dispositivos_cadastrados/);
 assert.match(sql,/CREATE UNIQUE INDEX IF NOT EXISTS participantes_nome_tipo_unico/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS (qr_sessions|admin_sessions)/);
 assert.match(sql,/ON DELETE SET NULL/);
});

test('Cursos: 14 períodos definidos; servidor Next.js bloqueia combinações inválidas',()=>{
 const {PERIODOS_POR_CURSO,maxPeriodosCurso}=load(`${root}/src/lib/cursos.ts`);
 const {validarParticipante}=load(`${root}/src/lib/types.ts`,{'./cursos':{maxPeriodosCurso}});
 const oito=['Administração','Ciências Contábeis','Educação Física','Engenharia de Software','Pedagogia','Terapia Ocupacional'];
 const dez=['Direito','Enfermagem','Engenharia Agronômica','Engenharia Civil','Medicina Veterinária','Nutrição','Psicologia','Zootecnia'];
 assert.equal(Object.keys(PERIODOS_POR_CURSO).length,14);
 for(const c of oito){
  assert.equal(maxPeriodosCurso(c),8);
  assert.equal(validarParticipante({nome:'Teste',tipo:'aluno',curso:c,periodo:8}).valor.periodo,8);
  assert.match(validarParticipante({nome:'Teste',tipo:'aluno',curso:c,periodo:9}).erro,/1º ao 8º/);
  assert.ok(validarParticipante({nome:'Teste',tipo:'aluno',curso:c,periodo:10}).erro);
 }
 for(const c of dez){
  assert.equal(maxPeriodosCurso(c),10);
  assert.equal(validarParticipante({nome:'Teste',tipo:'aluno',curso:c,periodo:10}).valor.periodo,10);
  assert.ok(validarParticipante({nome:'Teste',tipo:'aluno',curso:c,periodo:11}).erro);
 }
 const cmp=fs.readFileSync('src/components/ParticipanteFields.tsx','utf8');
 assert.match(cmp,/length:maxPeriodosCurso\(value\.curso\)/);
 assert.match(cmp,/onChange=\{curso=>onChange\(\{\.\.\.value,curso,periodo:''\}\)\}/);
});
