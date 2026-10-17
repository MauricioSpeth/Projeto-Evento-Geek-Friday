import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const file=new URL('../src/lib/exportacao.ts',import.meta.url);
const output=ts.transpileModule(readFileSync(file,'utf8'),{fileName:'exportacao.ts',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const exports={};
runInNewContext(output,{exports});
const {consulta,gerarCSV,campo}=exports;
test('Exportação TypeScript gera CSV correto para português brasileiro',()=>{
 const sample=[{id:1,nome:'Maria; "Alves"',tipo:'aluno',curso:'Educação Física',periodo:4,data_hora:'2026-10-10T15:00:00Z',origem_cadastro:'publico'},
 {id:2,nome:'Professor A',tipo:'professor',curso:'Direito',periodo:null,data_hora:'2026-10-10T16:00:00Z',origem_cadastro:'admin'}];
 const csv=gerarCSV(sample);
 assert.ok(csv.startsWith('\uFEFF'));
 assert.match(csv,/"Maria; ""Alves"""/);
 assert.match(csv,/"10\/10\/2026 12:00:00"/);
 assert.match(csv,/Educação Física/);
 assert.equal(csv.split('\r\n').length,4);
});
test('Consultas separam todos e alunos sem aceitar filtro arbitrário',()=>{
 const q1=consulta('todos'),q2=consulta('alunos');
 assert.match(q1.sql,/FROM participantes/);
 assert.doesNotMatch(q1.sql,/WHERE tipo/);
 assert.equal(Array.from(q1.params).length,0);
 assert.match(q2.sql,/WHERE tipo = \$1/);
 assert.deepEqual(Array.from(q2.params),['aluno']);
 assert.equal(consulta('qualquer'),null);
});
test('CSV neutraliza fórmulas em células',()=>{
 for(const v of ['=1+1',' +2','-3','@SUM(A1)','\t=HYPERLINK(1)'])assert.match(campo(v),/^"'/);
});
