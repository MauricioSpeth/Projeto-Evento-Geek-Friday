'use client';
import {useState} from 'react';
import DashboardIcon from './DashboardIcon';

type Props={isGeral:boolean;eventoAtivo:boolean;onLimpeza:()=>Promise<void>};
type Modo='backup'|'limpar'|null;

export default function ManutencaoBanco({isGeral,eventoAtivo,onLimpeza}:Props){
 const [modo,setModo]=useState<Modo>(null);
 const [senha,setSenha]=useState('');
 const [backupAntes,setBackupAntes]=useState(true);
 const [comprovante,setComprovante]=useState('');
 const [ack,setAck]=useState(false);
 const [confirmacao,setConfirmacao]=useState('');
 const [busy,setBusy]=useState(false);
 const [erro,setErro]=useState('');
 const [mensagem,setMensagem]=useState('');
 if(!isGeral)return null;

 function abrir(proximo:Modo){
  setModo(proximo);setSenha('');setBackupAntes(true);setComprovante('');
  setAck(false);setConfirmacao('');setErro('');setMensagem('');
 }
 function mudarBackup(value:boolean){setBackupAntes(value);setComprovante('');setAck(false);setMensagem('');}

 async function baixar(){
  if(busy||!senha)return;
  setBusy(true);setErro('');setMensagem('');setAck(false);setComprovante('');
  try{
   const response=await fetch('/api/admin/banco/backup',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({senha})
   });
   if(!response.ok){const e=await response.json().catch(()=>({}));throw Error(e.mensagem||'Falha ao gerar backup.');}
   const arquivo=await response.blob();
   const nome=response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1]||'app-geek-backup.json';
   const url=URL.createObjectURL(arquivo);
   try{
    const a=document.createElement('a');a.href=url;a.download=nome;document.body.append(a);a.click();a.remove();
   }finally{setTimeout(()=>URL.revokeObjectURL(url),30000);}
   setComprovante(response.headers.get('X-Backup-Confirmation')||'');
   setMensagem('Download iniciado. Confira se o arquivo JSON foi salvo na pasta Downloads.');
  }catch(e){setErro(e instanceof Error?e.message:'Falha ao gerar backup.');}
  finally{setBusy(false);}
 }

 async function limpar(){
  if(busy||!senha||eventoAtivo||confirmacao!=='EXCLUIR'||!ack||(backupAntes&&!comprovante))return;
  if(!window.confirm('Confirma a exclusão DEFINITIVA dos participantes, dispositivos e sessões QR? Administradores e configurações serão mantidos.'))return;
  setBusy(true);setErro('');
  try{
   const response=await fetch('/api/admin/banco/limpar',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({senha,confirmacao:'EXCLUIR',backupAntes,comprovante,cienteSemBackup:!backupAntes&&ack})
   });
   const data=await response.json().catch(()=>({})) as {mensagem?:string;removidos?:{participantes:number}};
   if(!response.ok)throw Error(data.mensagem||'Não foi possível limpar.');
   abrir(null);
   await onLimpeza();
   window.alert(`Limpeza concluída: ${data.removidos?.participantes??0} participantes removidos. Contas e configurações preservadas.`);
  }catch(e){setErro(e instanceof Error?e.message:'Não foi possível limpar.');}
  finally{setBusy(false);}
 }

 return <>
  <div className="banco-acoes" aria-label="Backup e limpeza do evento">
   <button type="button" className="botao banco-botao-backup" title="Baixar backup dos dados do App Geek" aria-label="Baixar backup dos dados do App Geek" onClick={()=>abrir('backup')}><DashboardIcon name="database" size={17}/> Backup</button>
   <button type="button" className="botao banco-botao-limpar" title="Excluir todos os cadastros do evento" aria-label="Excluir todos os cadastros do evento" onClick={()=>abrir('limpar')}><DashboardIcon name="trash" size={17}/> Excluir</button>
  </div>
  {modo&&<div className="fundo-modal" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)abrir(null);}}>
   <div className="cartao modal-banco" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-banco">
    <h2 id="titulo-modal-banco">{modo==='backup'?'Baixar backup do App Geek':'Limpar dados do evento'}</h2>
    <p className="banco-aviso">
     {modo==='backup'
      ? 'O arquivo JSON contém os dados das tabelas do App Geek, incluindo dados pessoais e hashes administrativos. Guarde em local seguro.'
      : 'Esta operação é irreversível sem um backup. Serão apagados participantes, bloqueios de dispositivos e sessões QR. Administradores e configurações serão preservados.'}
    </p>
    <div className="campo">
     <label htmlFor="senha-master-banco">Senha do administrador master (admin) *</label>
     <input id="senha-master-banco" type="password" autoComplete="current-password" value={senha} onChange={e=>{setSenha(e.target.value);setComprovante('');setAck(false);}} maxLength={512} required/>
    </div>
    {modo==='limpar'&&<>
     <label className="banco-check"><input type="checkbox" checked={backupAntes} onChange={e=>mudarBackup(e.target.checked)}/><span>Baixar backup antes de excluir os cadastros (recomendado)</span></label>
     {backupAntes&&<div className="banco-etapa">
       <button type="button" className="botao banco-botao-backup" disabled={busy||!senha} onClick={()=>void baixar()}>{busy?'Preparando...':'1. Gerar e baixar backup'}</button>
       {comprovante&&<p className="banco-ok">Backup gerado. Confira se o arquivo foi realmente salvo no seu dispositivo.</p>}
     </div>}
     <label className="banco-check"><input type="checkbox" checked={ack} disabled={backupAntes&&!comprovante} onChange={e=>setAck(e.target.checked)}/><span>{backupAntes?'Confirmo que salvei o arquivo de backup.':'Estou ciente de que vou excluir os registros SEM BACKUP.'}</span></label>
     <div className="campo"><label htmlFor="confirma-banco">Digite <strong>EXCLUIR</strong> para confirmar *</label>
       <input id="confirma-banco" value={confirmacao} onChange={e=>setConfirmacao(e.target.value)} autoComplete="off" placeholder="EXCLUIR"/>
     </div>
     {eventoAtivo&&<p className="banco-alerta">Desligue as inscrições no Controle do Evento antes de realizar a limpeza.</p>}
    </>}
    {erro&&<p className="aviso-inline aviso-erro" role="alert">{erro}</p>}
    {mensagem&&<p className="banco-ok" role="status">{mensagem}</p>}
    <div className="acoes-modal banco-modal-acoes">
     <button type="button" className="botao botao-secundario" disabled={busy} onClick={()=>abrir(null)}>Cancelar</button>
     {modo==='backup'
      ? <button type="button" className="botao banco-botao-backup" disabled={busy||!senha} onClick={()=>void baixar()}>{busy?'Gerando...':'Baixar backup (JSON)'}</button>
      : <button type="button" className="botao banco-botao-limpar" disabled={busy||eventoAtivo||!senha||!ack||confirmacao!=='EXCLUIR'||(backupAntes&&!comprovante)} onClick={()=>void limpar()}>{busy?'Excluindo...':'2. Excluir definitivamente'}</button>}
    </div>
   </div>
  </div>}
 </>;
}
