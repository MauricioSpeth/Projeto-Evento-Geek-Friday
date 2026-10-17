'use client';
import {useEffect,useRef,useState} from 'react';

type Config={ativo:boolean;qr_tempo_segundos:number;qr_versao:string;geracao_atividade:string;atualizado_em:string};

export default function ControleEvento({onStatusChange}:{onStatusChange:(active:boolean)=>void}){
 const [config,setConfig]=useState<Config|null>(null);
 const [rascunho,setRascunho]=useState('15');
 const [salvando,setSalvando]=useState(false);
 const [aviso,setAviso]=useState('');
 const alterando=useRef(false);

 useEffect(()=>{
  let montado=true;
  async function atualizar(){
   try{
    const res=await fetch('/api/admin/config',{cache:'no-store'});
    if(res.status===401){window.location.replace('/login');return;}
    const dados=await res.json();
    if(!res.ok)throw Error(dados.mensagem||'Falha ao consultar as configurações.');
    if(!montado)return;
    setConfig(dados as Config);
    onStatusChange((dados as Config).ativo);
    if(!alterando.current)setRascunho(String((dados as Config).qr_tempo_segundos));
   }catch(err){if(montado){setAviso(err instanceof Error?err.message:'Falha de conexão.');onStatusChange(false);}}
  }
  void atualizar();const intervalo=setInterval(()=>{if(!document.hidden)void atualizar();},2000);
  return()=>{montado=false;clearInterval(intervalo);};
 },[onStatusChange]);

 async function salvar(payload:{ativo:boolean}|{qr_tempo_segundos:number}){
  if(salvando)return;
  setSalvando(true);setAviso('');
  try{
   const resposta=await fetch('/api/admin/config',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});
   const dados=await resposta.json();
   if(!resposta.ok)throw Error(dados.mensagem||'Não foi possível atualizar a configuração.');
   const atualizado=dados as Config;
   setConfig(atualizado);onStatusChange(atualizado.ativo);
   alterando.current=false;setRascunho(String(atualizado.qr_tempo_segundos));
   setAviso('Configuração salva. A tela do QR será atualizada automaticamente.');
  }catch(err){setAviso(err instanceof Error?err.message:'Erro ao salvar.');}
  finally{setSalvando(false);}
 }
 function mudarStatus(){
  if(!config)return;
  if(config.ativo&&!window.confirm('Desligar o sistema? O QR Code e todos os novos cadastros serão bloqueados imediatamente.'))return;
  void salvar({ativo:!config.ativo});
 }
 function salvarTempo(e:React.FormEvent){
  e.preventDefault();const numero=Number(rascunho);
  if(!Number.isInteger(numero)||numero<1||numero>3600){setAviso('Informe um número inteiro de 1 a 3600 segundos.');return;}
  void salvar({qr_tempo_segundos:numero});
 }
 return <section className="cartao controle-evento" aria-label="Controle do evento">
  <div className="controle-titulo"><div><h2>Controle do evento</h2><p>Configurações gravadas no PostgreSQL e compartilhadas entre administradores.</p></div>
  <span className={`controle-estado ${config?.ativo?'controle-ativo':'controle-desligado'}`}>{!config?'Carregando':config.ativo?'● Sistema ligado':'● Sistema desligado'}</span></div>
  <div className="controle-linha">
   <div className="controle-campo"><label htmlFor="interruptor-evento">Inscrições e QR Code</label><p>Quando desligado, novos cadastros e alterações de participantes são bloqueados pelo servidor.</p></div>
   <button id="interruptor-evento" type="button" role="switch" aria-checked={config?.ativo??false} aria-label="Ligar ou desligar inscrições e QR Code" onClick={mudarStatus} disabled={!config||salvando} className={`controle-switch ${config?.ativo?'ligado':''}`}><span className="controle-switch-bola"/></button>
  </div>
  <form className="controle-linha controle-form-tempo" onSubmit={salvarTempo}>
   <div className="controle-campo"><label htmlFor="segundos-qr">Validade de cada QR Code (segundos)</label><p>Atualiza automaticamente a tela do QR. O formulário continua com prazo de 3 minutos.</p></div>
   <div className="controle-entrada"><input id="segundos-qr" type="number" inputMode="numeric" min="1" max="3600" step="1" required disabled={!config||salvando} value={rascunho} onChange={e=>{alterando.current=true;setRascunho(e.target.value);}}/><button className="botao botao-primario" type="submit" disabled={!config||salvando||rascunho===String(config.qr_tempo_segundos)}>{salvando?'Salvando...':'Aplicar tempo'}</button></div>
  </form>
  {config&&<p className="controle-atual">Tempo atual: <strong>{config.qr_tempo_segundos} segundos</strong></p>}
  {aviso&&<p className="aviso-inline" role="status">{aviso}</p>}
 </section>;
}
