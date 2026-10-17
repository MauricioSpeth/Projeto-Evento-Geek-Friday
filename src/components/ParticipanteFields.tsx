'use client';
import {CURSOS,maxPeriodosCurso} from '@/lib/cursos';
import type {ParticipanteForm,TipoUI} from '@/lib/types';
import DarkDropdown from './DarkDropdown';
const types:{value:TipoUI;label:string;emoji:string}[]=[{value:'universitario',label:'Universitário',emoji:'🎓'},{value:'professor',label:'Professor',emoji:'🧑‍🏫'},{value:'visitante',label:'Visitante',emoji:'🎃'}];
export const blankForm=():ParticipanteForm=>({nome:'',tipo:'visitante',curso:'',periodo:''});
export function ParticipanteFields({value,onChange,idPrefix='cadastro'}:{value:ParticipanteForm;onChange:(v:ParticipanteForm)=>void;idPrefix?:string}){
 const set=<K extends keyof ParticipanteForm>(key:K,val:ParticipanteForm[K])=>onChange({...value,[key]:val});
 const hasCourse=value.tipo!=='visitante';
 const hasPeriod=value.tipo==='universitario';
 // Mantém a leitura/edição de cursos antigos eventualmente salvos no banco.
 const options=[...(value.curso&&!CURSOS.some(c=>c===value.curso)?[value.curso]:[]),...CURSOS].map(c=>({value:c,label:c}));
 const periodOptions=Array.from({length:maxPeriodosCurso(value.curso)},(_,i)=>({value:String(i+1),label:`${i+1}º período`}));
 return <>
 <div className="campo"><label htmlFor={`${idPrefix}-nome`}>Nome completo *</label><input required id={`${idPrefix}-nome`} type="text" autoComplete="name" maxLength={150} value={value.nome} onChange={e=>set('nome',e.target.value)} placeholder="Nome e sobrenome"/></div>
 <div className="campo"><label>Você é *</label><div className="opcoes-tipo">{types.map(t=><label className="opcao-tipo" key={t.value}><input type="radio" name={`${idPrefix}-tipo`} checked={value.tipo===t.value} onChange={()=>onChange({...value,tipo:t.value,curso:t.value==='visitante'?'':value.curso,periodo:''})}/><span className="opcao-icone" aria-hidden="true">{t.emoji}</span><span>{t.label}</span></label>)}</div></div>
 {hasCourse&&<div className="campo"><label htmlFor={`${idPrefix}-curso`}>Curso *</label><DarkDropdown required id={`${idPrefix}-curso`} value={value.curso} options={options} placeholder="Selecione seu curso..." onChange={curso=>onChange({...value,curso,periodo:''})}/></div>}
 {hasPeriod&&<div className="campo"><label htmlFor={`${idPrefix}-periodo`}>Período *</label><DarkDropdown id={`${idPrefix}-periodo`} required disabled={!value.curso} value={value.periodo} placeholder={value.curso?'Selecione...':'Escolha um curso primeiro'} options={periodOptions} onChange={periodo=>set('periodo',periodo)}/></div>}
 </>;
}
