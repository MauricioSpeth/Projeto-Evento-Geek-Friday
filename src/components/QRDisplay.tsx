'use client';
import {useEffect,useRef,useState} from 'react';

type DadosQR={ativo:boolean;tempoSegundos:number;token?:string;imagem:string|null;expiraEm:number|null;agora:number};
export default function QRDisplay(){
 const [imagem,setImagem]=useState(''),[segundos,setSegundos]=useState(0),[tempo,setTempo]=useState(15);
 const [mensagem,setMensagem]=useState('Preparando QR...');
 const tokenAtual=useRef('');const expira=useRef(0);const desvio=useRef(0);
 useEffect(()=>{
  let montado=true,ocupado=false;
  async function atualizar(){
   if(ocupado)return;ocupado=true;
   try{
    const url=`/api/qr?atual=${encodeURIComponent(tokenAtual.current)}`;
    const resp=await fetch(url,{cache:'no-store'});
    if(resp.status===401){window.location.assign('/login?next=/qr');return;}
    if(!resp.ok)throw Error('QR indisponível.');
    const dados=await resp.json() as DadosQR;
    if(!montado)return;
    setTempo(dados.tempoSegundos);
    if(!dados.ativo){
     tokenAtual.current='';expira.current=0;setImagem('');setSegundos(0);
     setMensagem('Sistema desligado. QR Code e novos cadastros estão pausados.');return;
    }
    if(dados.token!==tokenAtual.current){
     tokenAtual.current=dados.token||'';
     setImagem(dados.imagem||'');
    }
    expira.current=dados.expiraEm||0;
    desvio.current=dados.agora-Date.now();
    setMensagem('');
   }catch{
    if(montado){tokenAtual.current='';expira.current=0;setImagem('');setMensagem('Sem conexão com o servidor. Tentando novamente...');}
   }finally{ocupado=false;}
  }
  void atualizar();
  // Alterações do Admin aparecem na tela em aproximadamente um segundo.
  const consulta=setInterval(()=>{if(!document.hidden)void atualizar();},1000);
  const contagem=setInterval(()=>{if(montado)setSegundos(Math.max(0,Math.ceil((expira.current-Date.now()-desvio.current)/1000)));},250);
  return()=>{montado=false;clearInterval(consulta);clearInterval(contagem);};
 },[]);
 return <div className="qr-pagina">
  <main className="qr-apresentacao">
   <section className="qr-informacoes" aria-labelledby="qr-titulo">
    <span className="qr-identidade">GEEK FRIDAY <span aria-hidden="true">•</span> HALLOWGEEK</span>
    <h1 id="qr-titulo">Cadastre-se no <span>HallowGeek</span></h1>
    <p className="qr-instrucao">Escaneie o QR Code com a câmera do seu celular para fazer seu cadastro.</p>
    <div className="qr-aviso-prazo">
     <span className="qr-aviso-icone" aria-hidden="true">3</span>
     <p>Depois de escanear, você terá <strong>3 minutos</strong> para concluir o cadastro.</p>
    </div>
   </section>
   <section className="qr-area-codigo" aria-label="QR Code para inscrição">
    <div className="qr-codigo-moldura">
     {imagem
      ? <img src={imagem} alt="QR Code para fazer a inscrição no HallowGeek"/>
      : <div className="qr-sem-codigo" role="status">{mensagem||'Preparando QR Code...'}</div>}
    </div>
    <p className="qr-legenda">Aponte a câmera do celular para o código</p>
   </section>
  </main>
  <footer className="qr-rodape">
   {mensagem
    ? <p role="status">{mensagem}</p>
    : <p>Próximo QR Code em <strong>{segundos} s</strong><span className="qr-rodape-separador" aria-hidden="true">•</span>Validade de cada QR: {tempo} s</p>}
  </footer>
 </div>;
}
