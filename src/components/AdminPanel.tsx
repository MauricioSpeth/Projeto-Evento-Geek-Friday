'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {useDialogKeyboard} from '@/lib/useDialogKeyboard';
import {useRouter} from 'next/navigation';
import {CURSOS} from '@/lib/cursos';
import {ParticipanteFields,blankForm} from './ParticipanteFields';
import ControleEvento from './ControleEvento';
import AdminSidebar from './AdminSidebar';
import ManutencaoBanco from './ManutencaoBanco';
import DashboardIcon from './DashboardIcon';
import {fromForm,displayType,type Participante,type ParticipanteForm, type TipoBanco} from '@/lib/types';

async function api<T>(url:string,init?:RequestInit):Promise<T>{
 const res=await fetch(url,{cache:'no-store',...init});let data:any={};try{data=await res.json();}catch{}
 if(res.status===401){window.location.replace('/login');throw Error('Sessão expirada. Entre novamente.');}
 if(!res.ok)throw Error(data.mensagem||'Erro ao comunicar com o servidor.');return data as T;
}
const PAL=['#189aff','#994df5','#17d77a','#f59e0b','#ef539a','#36b9e5'];
function ChartDonut({title,items}:{title:string;items:{name:string;value:number}[]}){
 const total=items.reduce((sum,item)=>sum+item.value,0);
 let offset=0;
 const segments=items.map((item,index)=>({...item,color:PAL[index%PAL.length]}));
 const stops=segments.filter(item=>item.value>0).map(item=>{
   const start=offset;offset+=item.value/total*100;
   return `${item.color} ${start}% ${offset}%`;
 }).join(', ');
 return <div className="cartao cartao-grafico grafico-tipos">
  <div className="grafico-cabecalho"><h2>{title}</h2><span className="grafico-intervalo"><DashboardIcon name="calendar" size={15}/> Todo o evento</span></div>
  <div className="grafico-linha">
   <div className="rosca" role="img" aria-label={`${title}: ${segments.map(x=>`${x.name} ${x.value}`).join(', ')}`} style={{background:total?`conic-gradient(${stops})`:undefined}}>
     <div className="rosca-centro"><strong>{total}</strong><span>cadastros</span></div>
   </div>
   <ul className="legenda">{segments.map(item=><li key={item.name}>
     <span className="swatch" style={{background:item.color}}/><span className="legenda-nome">{item.name}</span>
     <strong className="legenda-contagem">{item.value}</strong><small className="legenda-percentual">({total?(item.value/total*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}):'0,0'}%)</small>
   </li>)}</ul>
  </div>
 </div>;
}
function ChartBars({title,items}:{title:string;items:{name:string;value:number}[]}){
 const display=items.slice(0,6),max=Math.max(...display.map(item=>item.value),1);
 const scale=Math.ceil(max/4)*4;
 return <div className="cartao cartao-grafico cartao-barras">
   <div className="grafico-cabecalho"><h2>{title}</h2><span className="grafico-intervalo"><DashboardIcon name="calendar" size={15}/> Todo o evento</span></div>
   {display.length?<div className="grafico-barras-quadro" aria-label={title} role="img">
     <div className="grafico-eixo">{[4,3,2,1,0].map(n=><span key={n}>{Math.round(scale*n/4)}</span>)}</div>
     <div className="grafico-barras-novo">{display.map(item=><div className="grafico-coluna" key={item.name}>
       <div className="grafico-coluna-pista"><div className="grafico-coluna-conteudo" style={{height:`${Math.max(2,item.value/scale*100)}%`}}><strong>{item.value}</strong></div></div>
       <span title={item.name}>{item.name}</span>
     </div>)}</div>
   </div>:<p className="graficos-vazios">Nenhum cadastro por curso.</p>}
 </div>;
}
function formatDate(s:string){try{return new Date(s).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'});}catch{return '—';}}
export default function AdminPanel({username,isGeral}:{username:string;isGeral:boolean}){
 const router=useRouter(),[entries,setEntries]=useState<Participante[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [eventoAtivo,setEventoAtivo]=useState(false);
 const [lateralAberta,setLateralAberta]=useState(true);
 const [periodFilter,setPeriodFilter]=useState('');
 const [nameFilter,setNameFilter]=useState(''),[typeFilter,setTypeFilter]=useState(''),[courseFilter,setCourseFilter]=useState('');
 const [editor,setEditor]=useState<{kind:'novo'|'editar';id?:number}|null>(null),[form,setForm]=useState<ParticipanteForm>(blankForm());
 const [newAdmin,setNewAdmin]=useState(false),[adminUser,setAdminUser]=useState(''),[adminPass,setAdminPass]=useState(''),[adminConfirm,setAdminConfirm]=useState('');
 const closeDialogs=useCallback(()=>{setEditor(null);setNewAdmin(false);},[]);
 useDialogKeyboard(!!editor||newAdmin,closeDialogs);
 const refresh=useCallback(async(silent=false)=>{try{const all=await api<Participante[]>('/api/participantes');setEntries(all);if(!silent)setError('');}catch(err){if(!silent)setError(err instanceof Error?err.message:'Erro de conexão.');}},[]);
 useEffect(()=>{refresh();const timer=setInterval(()=>{if(!document.hidden)refresh(true);},10000);return()=>clearInterval(timer);},[refresh]);
 useEffect(()=>{if(window.matchMedia('(max-width: 900px)').matches)setLateralAberta(false);},[]);
 const count=(tipo:TipoBanco)=>entries.filter(e=>e.tipo===tipo).length;
 const totals=[{name:'Universitários',value:count('aluno')},{name:'Professores',value:count('professor')},{name:'Visitantes',value:count('visitante')}];
 const courseTotals=useMemo(()=>{const counts=new Map<string,number>();for(const e of entries)if(e.curso)counts.set(e.curso,(counts.get(e.curso)||0)+1);return [...counts].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);},[entries]);
 const filtered=useMemo(()=>entries.filter(e=>`${e.nome} ${e.curso||''} ${displayType[e.tipo]}`.toLocaleLowerCase('pt-BR').includes(nameFilter.trim().toLocaleLowerCase('pt-BR'))&&(!typeFilter||e.tipo===typeFilter)&&(!courseFilter||e.curso===courseFilter)&&(!periodFilter||String(e.periodo||'')===periodFilter)),[entries,nameFilter,typeFilter,courseFilter,periodFilter]);
 function openNew(){if(!eventoAtivo){setError('O sistema está desligado. Ligue-o no controle do evento para cadastrar.');return;}setForm(blankForm());setEditor({kind:'novo'});setError('');}
 function openEdit(item:Participante){if(!eventoAtivo){setError('Sistema desligado. Alterações de participantes estão bloqueadas.');return;}setForm({nome:item.nome,tipo:item.tipo==='aluno'?'universitario':item.tipo,curso:item.curso||'',periodo:item.periodo?String(item.periodo):''});setEditor({kind:'editar',id:item.id});setError('');}
 async function save(e:React.FormEvent){e.preventDefault();if(!editor||busy)return;setBusy(true);setError('');
 try{const path=editor.kind==='editar'?`/api/participantes/${editor.id}`:'/api/participantes';await api(path,{method:editor.kind==='editar'?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fromForm(form))});setEditor(null);await refresh();}
 catch(err){setError(err instanceof Error?err.message:'Não foi possível salvar.');}finally{setBusy(false);}}
 async function remove(item:Participante){if(!eventoAtivo){setError('Sistema desligado. Alterações de participantes estão bloqueadas.');return;}if(!confirm(`Excluir cadastro de ${item.nome}? O bloqueio do navegador será mantido.`))return;setBusy(true);setError('');
 try{await api(`/api/participantes/${item.id}`,{method:'DELETE'});await refresh();}catch(err){setError(err instanceof Error?err.message:'Erro ao excluir.');}finally{setBusy(false);}}
 async function createAdmin(e:React.FormEvent){e.preventDefault();if(adminPass!==adminConfirm){setError('As senhas dos administradores não conferem.');return;}setBusy(true);setError('');
 try{await api('/api/admins',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:adminUser,senha:adminPass})});setNewAdmin(false);setAdminUser('');setAdminPass('');setAdminConfirm('');alert('Administrador criado com sucesso.');}
 catch(err){setError(err instanceof Error?err.message:'Erro ao criar admin.');}finally{setBusy(false);}}
 async function logout(){try{await api('/api/admin/logout',{method:'POST'});}catch{}router.replace('/login');router.refresh();}
 return <main className={`pagina-admin pagina-admin-layout ${lateralAberta?'lateral-aberta':'lateral-fechada'}`}>
 <div className="cabecalho-admin">
  <div className="cabecalho-admin-titulo"><button type="button" className="botao-hamburguer" aria-label={lateralAberta?'Fechar menu de administradores':'Abrir menu de administradores'} aria-controls="menu-lateral-admin" aria-expanded={lateralAberta} onClick={()=>setLateralAberta(v=>!v)}><DashboardIcon name="menu" size={24}/></button><h1>Painel de Cadastros</h1></div>
  <div className="acoes-cabecalho"><span className="usuario-logado">Olá, {username}</span><button type="button" className="botao botao-sair" onClick={logout}><DashboardIcon name="logout" size={17}/> Sair</button></div>
 </div>
 {lateralAberta&&<><button className="admin-lateral-sombra" type="button" aria-label="Fechar menu lateral" onClick={()=>setLateralAberta(false)}/><AdminSidebar usuarioAtual={username} isGeral={isGeral} eventoAtivo={eventoAtivo} onNovoCadastro={openNew} onNovoAdmin={()=>{setError('');setNewAdmin(true);}} onFechar={()=>{if(window.matchMedia('(max-width: 900px)').matches)setLateralAberta(false);}}/></>}
 <div className="admin-conteudo">
 {error&&<div className="aviso-inline aviso-erro" role="alert">{error}</div>}
 <section className="resumo"><div className="cartao cartao-resumo"><span className="resumo-icone" aria-hidden="true"><DashboardIcon name="users" size={27}/></span><div><span className="resumo-legenda">Total de cadastros</span><span className="resumo-numero">{entries.length}</span></div></div>{totals.map((x,i)=><div className="cartao cartao-resumo" key={x.name}><span className="resumo-icone" aria-hidden="true"><DashboardIcon name={(['graduation','teacher','visitors'] as const)[i]} size={27}/></span><div><span className="resumo-legenda">{x.name}</span><span className="resumo-numero">{x.value}</span></div></div>)}</section>
 <section className="graficos"><ChartDonut title="Cadastros por tipo" items={totals}/><ChartBars title="Cadastros por curso" items={courseTotals}/></section>
 <section className="cartao cartao-tabela" aria-labelledby="titulo-lista-cadastros">
 <div className="cabecalho-lista-cadastros banco-cabecalho"><div><h2 id="titulo-lista-cadastros">Cadastros recentes</h2><p>Mais recentes primeiro. Role a lista para consultar os anteriores.</p></div><ManutencaoBanco isGeral={isGeral} eventoAtivo={eventoAtivo} onLimpeza={()=>refresh()}/></div>
 <div className="filtros"><div className="busca-com-icone"><DashboardIcon name="search" size={19}/><input aria-label="Buscar por nome, tipo ou curso" type="text" value={nameFilter} onChange={e=>setNameFilter(e.target.value)} placeholder="Buscar por nome, tipo ou curso..."/></div><select aria-label="Filtrar tipo" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option value="">Todos os tipos</option><option value="aluno">Universitário</option><option value="professor">Professor</option><option value="visitante">Visitante</option></select><select aria-label="Filtrar curso" value={courseFilter} onChange={e=>setCourseFilter(e.target.value)}><option value="">Todos os cursos</option>{CURSOS.map(c=><option key={c} value={c}>{c}</option>)}</select><select aria-label="Filtrar período" value={periodFilter} onChange={e=>setPeriodFilter(e.target.value)}><option value="">Todos os períodos</option>{Array.from({length:10},(_,i)=><option key={i+1} value={String(i+1)}>{i+1}º período</option>)}</select></div>
 <div className="tabela-scroll" tabIndex={0} aria-label="Cadastros: use a rolagem para consultar todos os registros"><table className="tabela-cadastros"><thead><tr><th>#</th><th>Nome</th><th>Tipo</th><th>Curso / Área</th><th>Período</th><th>Data do cadastro</th><th>Ações</th></tr></thead><tbody>{filtered.map(item=><tr key={item.id}><td>{item.id}</td><td>{item.nome}</td><td><span className={`etiqueta-tipo etiqueta-${item.tipo==='aluno'?'universitario':item.tipo}`}>{displayType[item.tipo]}</span></td><td>{item.curso||'—'}</td><td>{item.periodo?`${item.periodo}º`:'—'}</td><td>{formatDate(item.data_hora)}</td><td><button type="button" className="botao botao-editar" disabled={busy||!eventoAtivo} onClick={()=>openEdit(item)}><DashboardIcon name="pencil" size={14}/> Editar</button>{' '}<button type="button" className="botao botao-excluir" disabled={busy||!eventoAtivo} onClick={()=>remove(item)}><DashboardIcon name="trash" size={14}/> Excluir</button></td></tr>)}</tbody></table></div>{filtered.length===0&&<p className="sem-resultados">Nenhum cadastro encontrado.</p>}
 </section>
 <section className="cartao exportacao-cadastros" aria-labelledby="titulo-exportacao">
  <h2 id="titulo-exportacao">Exportar cadastros</h2>
  <p>Baixe os dados de todos os participantes ou somente dos alunos. Disponível mesmo com as inscrições desligadas.</p>
  <div className="exportacao-acoes">
   <a className="botao botao-exportar-todos" href="/api/admin/exportacoes/todos">⬇ Exportar todos os cadastros (CSV)</a>
   <a className="botao botao-exportar-alunos" href="/api/admin/exportacoes/alunos">⬇ Exportar somente alunos (CSV)</a>
  </div>
 </section>
 <ControleEvento onStatusChange={setEventoAtivo}/>
 </div>
 {editor&&<div className="fundo-modal" onMouseDown={e=>{if(e.target===e.currentTarget)setEditor(null);}}><div className="cartao modal-edicao" role="dialog" aria-modal="true" aria-label="Formulário de participante"><h2>{editor.kind==='novo'?'Novo cadastro':'Editar cadastro'}</h2><form onSubmit={save}><ParticipanteFields idPrefix="admin-form" value={form} onChange={setForm}/><div className="acoes-modal"><button type="button" className="botao botao-secundario" onClick={()=>setEditor(null)}>Cancelar</button><button type="submit" disabled={busy} className="botao botao-primario">{busy?'Salvando...':'Salvar'}</button></div></form>{error&&<p className="aviso-inline aviso-erro" role="alert">{error}</p>}</div></div>}
 {newAdmin&&<div className="fundo-modal" onMouseDown={e=>{if(e.target===e.currentTarget)setNewAdmin(false);}}><div className="cartao modal-admin" role="dialog" aria-modal="true" aria-label="Novo administrador"><h2>Novo administrador</h2><form onSubmit={createAdmin}><div className="campo"><label htmlFor="adminUser">Usuário *</label><input id="adminUser" type="text" required minLength={3} maxLength={40} pattern="[A-Za-z0-9._-]+" value={adminUser} onChange={e=>setAdminUser(e.target.value)}/></div><div className="campo"><label htmlFor="adminPass">Senha *</label><input id="adminPass" type="password" autoComplete="new-password" minLength={12} required value={adminPass} onChange={e=>setAdminPass(e.target.value)}/></div><div className="campo"><label htmlFor="adminConfirm">Confirmar senha *</label><input id="adminConfirm" type="password" required value={adminConfirm} onChange={e=>setAdminConfirm(e.target.value)}/></div><div className="acoes-modal"><button type="button" className="botao botao-secundario" onClick={()=>setNewAdmin(false)}>Cancelar</button><button type="submit" className="botao botao-primario" disabled={busy}>Criar admin</button></div>{error&&<p className="aviso-inline aviso-erro" role="alert">{error}</p>}</form></div></div>}
 </main>;
}
