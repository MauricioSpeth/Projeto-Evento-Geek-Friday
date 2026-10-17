'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import DashboardIcon from './DashboardIcon';

export default function LoginForm({next='/admin'}:{next?:string}){
 const router=useRouter();
 const [usuario,setUsuario]=useState('');
 const [senha,setSenha]=useState('');
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(false);
 const [senhaVisivel,setSenhaVisivel]=useState(false);
 async function submit(e:React.FormEvent){
  e.preventDefault();setError('');setLoading(true);
  try{
   const res=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario,senha})});
   const data=await res.json();if(!res.ok)throw Error(data.mensagem||'Login inválido');
   router.replace(next==='/qr'?'/qr':'/admin');router.refresh();
  }catch(err){setError(err instanceof Error?err.message:'Erro no login.');}finally{setLoading(false);}
 }
 return <div className="tela-login">
  <form className="cartao cartao-login" onSubmit={submit}>
   <span className="login-emblema" aria-hidden="true"><DashboardIcon name="users" size={36}/></span>
   <h1>Painel de Cadastros</h1>
   <p className="subtitulo-login">Acesso restrito à organização do evento.</p>
   <div className="campo login-campo"><label htmlFor="usuario">Usuário</label><div className="login-input-wrap">
    <DashboardIcon name="user" size={21}/>
    <input id="usuario" type="text" autoComplete="username" placeholder="Digite seu usuário..." required value={usuario} onChange={e=>setUsuario(e.target.value)}/>
   </div></div>
   <div className="campo login-campo"><label htmlFor="senha">Senha</label><div className="login-input-wrap">
    <DashboardIcon name="lock" size={21}/>
    <input id="senha" type={senhaVisivel?'text':'password'} autoComplete="current-password" placeholder="Digite sua senha..." required value={senha} onChange={e=>setSenha(e.target.value)}/>
    <button type="button" className="login-exibir-senha" onClick={()=>setSenhaVisivel(value=>!value)} aria-label={senhaVisivel?'Ocultar senha':'Mostrar senha'} aria-pressed={senhaVisivel}>
      <DashboardIcon name={senhaVisivel?'eye-off':'eye'} size={21}/>
    </button>
   </div></div>
   <button type="submit" className="botao botao-primario botao-largo login-entrar" disabled={loading}>
    <DashboardIcon name="logout" size={19}/>{loading?'Entrando...':'Entrar'}
   </button>
   {error&&<div role="alert" className="login-erro"><DashboardIcon name="alert" size={18}/><span>{error}</span></div>}
  </form>
 </div>;
}
