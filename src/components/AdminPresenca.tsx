'use client';
import {useEffect} from 'react';

// Conta usuários distintos, não abas abertas. Presença expira após 90 segundos.
export default function AdminPresenca(){
 useEffect(()=>{
  let ativa=true;
  const ping=async()=>{
   if(!ativa||document.hidden)return;
   try{await fetch('/api/admin/presenca',{method:'POST',cache:'no-store',credentials:'same-origin'});}catch{}
  };
  void ping();
  const id=setInterval(()=>void ping(),30000);
  const retomada=()=>void ping();
  window.addEventListener('focus',retomada);
  document.addEventListener('visibilitychange',retomada);
  return()=>{ativa=false;clearInterval(id);window.removeEventListener('focus',retomada);document.removeEventListener('visibilitychange',retomada);};
 },[]);
 return null;
}
