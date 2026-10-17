'use client';
import { useCallback, useEffect, useState } from 'react';
import DashboardIcon from './DashboardIcon';

type ContaOnline = { id: number; usuario: string; papel: 'admin'|'geral' };
type Resposta = { online: number; administradores: ContaOnline[] };

type Props = {
  usuarioAtual: string;
  isGeral: boolean;
  onNovoCadastro: () => void;
  onNovoAdmin: () => void;
  onFechar: () => void;
  eventoAtivo: boolean;
};

export default function AdminSidebar({usuarioAtual,isGeral,onNovoCadastro,onNovoAdmin,onFechar,eventoAtivo}:Props) {
  const [contas,setContas] = useState<ContaOnline[]>([]);
  const [erro,setErro] = useState('');
  const [excluindo,setExcluindo] = useState<number|null>(null);
  const carregar = useCallback(async()=>{
    try {
      const resposta = await fetch('/api/admins/online',{cache:'no-store',credentials:'same-origin'});
      if(resposta.status===401){window.location.assign('/login');return;}
      if(!resposta.ok)throw Error('Presença temporariamente indisponível.');
      const dados = await resposta.json() as Resposta;
      setContas(dados.administradores);setErro('');
    } catch(err){setErro(err instanceof Error?err.message:'Não foi possível consultar a presença.');}
  },[]);

  useEffect(()=>{
    void carregar();
    const id=window.setInterval(()=>{if(!document.hidden)void carregar();},15000);
    const atualizar=()=>{if(!document.hidden)void carregar();};
    document.addEventListener('visibilitychange',atualizar);
    return()=>{window.clearInterval(id);document.removeEventListener('visibilitychange',atualizar);};
  },[carregar]);

  const excluir = async(conta:ContaOnline)=>{
    if(!isGeral || conta.papel==='geral' || conta.usuario.toLowerCase()==='admin' || conta.usuario.toLowerCase()===usuarioAtual.toLowerCase() || excluindo!==null)return;
    if(!window.confirm(`Excluir permanentemente a conta de ${conta.usuario}? As sessões dela serão encerradas.`))return;
    setExcluindo(conta.id);setErro('');
    try{
      const resposta=await fetch(`/api/admins/${conta.id}`,{method:'DELETE',credentials:'same-origin'});
      const dados=await resposta.json().catch(()=>({})) as {mensagem?:string};
      if(!resposta.ok)throw Error(dados.mensagem||'Não foi possível excluir a conta.');
      await carregar();
    }catch(err){setErro(err instanceof Error?err.message:'Não foi possível excluir a conta.');}
    finally{setExcluindo(null);}
  };

  return <aside className="lateral-admin" id="menu-lateral-admin" aria-label="Administradores e ações">
    <div className="lateral-identidade">
      <span className="lateral-avatar" aria-hidden="true"><DashboardIcon name="user" size={27}/></span>
      <div><p className="lateral-identidade-legenda">Logado como</p>
        <strong>{usuarioAtual}{isGeral?' (master)':''} {isGeral&&<DashboardIcon name="crown" size={17} className="icone-master"/>}</strong>
        <p className="lateral-dica">{isGeral?'Somente o master pode excluir administradores.':'Sua conta tem acesso administrativo.'}</p>
      </div>
    </div>
    <div className="lateral-online-cabecalho">
      <h2><span className="status-online" aria-hidden="true"/> Admins online</h2>
      <p><strong className="lateral-online-numero" aria-live="polite">{contas.length}</strong> {contas.length===1?'admin online':'admins online'}</p>
    </div>
    {/* Aproximadamente três linhas visíveis; a barra de rolagem mostra os demais. */}
    <div className="lateral-online-scroll" tabIndex={0} aria-label="Lista rolável de administradores online">
      {contas.map(conta=><div className="lateral-admin-linha" key={conta.id}>
        <span className="status-online" aria-hidden="true"/>
        <div className="lateral-admin-nome"><strong>{conta.usuario}{conta.papel==='geral'&&<DashboardIcon name="crown" size={15} className="icone-master"/>}</strong>
          {conta.usuario.toLowerCase()===usuarioAtual.toLowerCase()&&<small>Você</small>}
        </div>
        {isGeral && conta.papel==='admin' && conta.usuario.toLowerCase()!=='admin' && conta.usuario.toLowerCase()!==usuarioAtual.toLowerCase() &&
          <button type="button" className="botao botao-excluir lateral-botao-excluir" onClick={()=>void excluir(conta)} disabled={excluindo!==null} title={`Excluir administrador ${conta.usuario}`} aria-label={`Excluir administrador ${conta.usuario}`}><DashboardIcon name="trash" size={13}/> Excluir</button>}
      </div>)}
      {contas.length===0&&<p className="lateral-vazio">Nenhum administrador ativo identificado.</p>}
    </div>
    {erro&&<p className="lateral-erro" role="alert">{erro}</p>}
    <nav className="lateral-acoes" aria-label="Ações do painel">
      <a className="botao botao-qr" href="/qr" target="_blank" rel="noopener noreferrer" onClick={onFechar}><DashboardIcon name="qr" size={18}/> Abrir QR Code</a>
      <button type="button" className="botao botao-primario" onClick={()=>{onNovoCadastro();onFechar();}} disabled={!eventoAtivo}><DashboardIcon name="plus" size={18}/> Novo cadastro</button>
      <button type="button" className="botao botao-novo-admin" onClick={()=>{onNovoAdmin();onFechar();}}><DashboardIcon name="plus" size={18}/> Novo admin</button>
    </nav>
  </aside>;
}
