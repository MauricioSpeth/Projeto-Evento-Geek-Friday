'use client';
import {useEffect,useState} from 'react';

export default function AdminsOnline(){
 const [online,setOnline]=useState<number|null>(null);
 useEffect(()=>{
  let mounted=true;
  const consultar=async()=>{
   try{
    const res=await fetch('/api/presenca-admins',{cache:'no-store'});
    if(!res.ok)throw Error('Sem conexão');
    const info=await res.json() as {online:number};
    if(mounted)setOnline(info.online);
   }catch{if(mounted)setOnline(null);}
  };
  void consultar();
  const id=setInterval(()=>void consultar(),30000);
  return()=>{mounted=false;clearInterval(id);};
 },[]);
 return <p className="admins-online" role="status" aria-live="polite"><span className="admins-online-ponto" aria-hidden="true"/>
  {online===null?'Status da portaria indisponível':`${online} ${online===1?'administrador online':'administradores online'}`}
 </p>;
}
