import {maxPeriodosCurso} from './cursos';
export type TipoBanco='aluno'|'professor'|'visitante';
export type TipoUI='universitario'|'professor'|'visitante';
export type Participante={id:number;nome:string;tipo:TipoBanco;curso:string|null;periodo:number|null;data_hora:string;origem_cadastro?:string;admin_criador_id?:number|null};
export type ParticipanteForm={nome:string;tipo:TipoUI;curso:string;periodo:string};
export function fromForm(form:ParticipanteForm){return {nome:form.nome,tipo:form.tipo==='universitario'?'aluno':form.tipo,curso:form.tipo==='visitante'?null:form.curso,periodo:form.tipo==='universitario'?Number(form.periodo):null};}
export const displayType:Record<TipoBanco,string>={aluno:'Universitário',professor:'Professor',visitante:'Visitante'};
export function validarParticipante(value:unknown):{erro:string}|{valor:{nome:string;tipo:TipoBanco;curso:string|null;periodo:number|null}} {
 if(!value||typeof value!=='object'||Array.isArray(value))return {erro:'Informe os dados do participante.'};
 const data=value as Record<string,unknown>;
 const nome=typeof data.nome==='string'?data.nome.trim().replace(/\s+/g,' '):'';
 if(!nome||nome.length>150)return {erro:'Nome deve ter entre 1 e 150 caracteres.'};
 if(typeof data.tipo!=='string'||!['aluno','visitante','professor'].includes(data.tipo))return {erro:'Tipo inválido.'};
 const tipo=data.tipo as TipoBanco;
 let curso:null|string=null,periodo:null|number=null;
 if(tipo!=='visitante'){
  curso=typeof data.curso==='string'?data.curso.trim():'';
  if(!curso||curso.length>100)return {erro:'Selecione um curso válido.'};
 }
 if(tipo==='aluno'){
  if((typeof data.periodo!=='number'&&typeof data.periodo!=='string')||!/^(10|[1-9])$/.test(String(data.periodo)))return {erro:'O período deve ser um número de 1 a 10.'};
  periodo=Number(data.periodo);
  const maximo=maxPeriodosCurso(curso!);
  if(periodo>maximo)return {erro:`O curso ${curso} permite apenas períodos do 1º ao ${maximo}º.`};
 }
 return {valor:{nome,tipo,curso,periodo}};
}
