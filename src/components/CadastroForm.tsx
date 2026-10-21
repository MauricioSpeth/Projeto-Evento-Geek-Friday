'use client';
import {useEffect,useRef,useState} from 'react';
import {ParticipanteFields,blankForm} from './ParticipanteFields';
import AdminsOnline from './AdminsOnline';
import {fromForm,type ParticipanteForm} from '@/lib/types';
export default function CadastroForm(){
 const [form,setForm]=useState<ParticipanteForm>(blankForm());
 const [status,setStatus]=useState<'verificando'|'ativo'|'expirado'|'bloqueado'>('verificando');
 const [message,setMessage]=useState('Validando acesso pelo QR Code...');
 const [end,setEnd]=useState(0),[delta,setDelta]=useState(0),[remaining,setRemaining]=useState(0),[busy,setBusy]=useState(false);
 const timer=useRef<ReturnType<typeof setInterval>|null>(null);
 useEffect(()=>{
  let mounted=true;
  async function verify(){
   // O servidor decide se este navegador já está cadastrado.
   try{
    const r=await fetch('/api/sessao',{cache:'no-store'});const data=await r.json();if(!mounted)return;
    if(r.status===409){setStatus('bloqueado');setMessage('Cadastro já realizado.');return;}
    if(!r.ok)throw Error(data.mensagem||'Escaneie um novo QR Code.');
    setEnd(data.expiraEm);setDelta(data.agora-Date.now());setStatus('ativo');
   }catch(err){if(mounted){setStatus('expirado');setMessage(err instanceof Error?err.message:'Acesso inválido.');}}
  }
  verify();return ()=>{mounted=false;};
 },[]);
 useEffect(()=>{if(status!=='ativo')return;
  let montado=true;
  async function verificarPausa(){
   try{const r=await fetch('/api/sessao',{cache:'no-store'});
    if(!montado)return;
    if(r.status===409){setStatus('bloqueado');setMessage('Cadastro já realizado.');}
    else if(r.status===423){setStatus('expirado');setMessage('Inscrições pausadas pela organização.');}
    else if(r.status===403){setStatus('expirado');setMessage('Sessão encerrada. Escaneie outro QR Code quando o sistema estiver ligado.');}
   }catch{ /* POST também verifica o estado, mesmo se esta consulta falhar. */ }
  }
  const intervalo=setInterval(()=>void verificarPausa(),2000);
  return()=>{montado=false;clearInterval(intervalo);};
 },[status]);
 useEffect(()=>{if(status!=='ativo')return; const update=()=>{const s=Math.max(0,Math.ceil((end-Date.now()-delta)/1000));setRemaining(s);if(s<=0){setStatus('expirado');setMessage('Prazo encerrado. Escaneie outro QR no evento.');}};update();timer.current=setInterval(update,250);return()=>{if(timer.current)clearInterval(timer.current);};},[status,end,delta]);
 async function submit(e:React.FormEvent){
  e.preventDefault();if(status!=='ativo'||busy||remaining<=0)return;setBusy(true);
  try{
   const r=await fetch('/api/participantes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fromForm(form))});const data=await r.json();
   if(!r.ok){if(r.status===409&&data.mensagem==='Cadastro já realizado.'){setStatus('bloqueado');setMessage('Cadastro já realizado.');return;}throw Error(data.mensagem||'Não foi possível realizar cadastro.');}
   setStatus('bloqueado');setMessage('Cadastro já realizado.');setForm(blankForm());
  }catch(err){setMessage(`❌ ${err instanceof Error?err.message:'Falha no cadastro.'}`);}finally{setBusy(false);}
 }
 if(status==='bloqueado')return <main className="pagina">
  <section className="cartao cartao-formulario cartao-cadastro-realizado" aria-labelledby="titulo-cadastro-realizado" role="status">
   <span className="cadastro-realizado-icone" aria-hidden="true">✓</span>
   <h1 id="titulo-cadastro-realizado">Cadastro já realizado</h1>
   <p className="cadastro-realizado-texto">Seu cadastro já foi realizado. Não é possível realizar outro cadastro.</p>
   <p className="cadastro-realizado-ajuda">Se precisar corrigir alguma informação, procure a portaria do evento.</p>
   <AdminsOnline/>
  </section>
 </main>;
 return <main className="pagina"><div className="cartao cartao-formulario"><h1>Cadastro do Evento</h1><p className="subtitulo">Preencha seus dados para participar do Geek Friday.</p>
 <p role="status" id="prazo-qr">{status==='ativo'?`Tempo para cadastrar: ${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`:message}</p>
 {status==='ativo'&&<form id="form-cadastro" onSubmit={submit}><ParticipanteFields value={form} onChange={setForm}/><button type="submit" disabled={busy} className="botao botao-primario botao-largo">{busy?'Cadastrando...':'Cadastrar'}</button></form>}
 {message.startsWith('❌')&&status==='ativo'&&<p className="aviso-inline aviso-erro" role="alert">{message}</p>}
 <AdminsOnline/>
 </div></main>;
}
