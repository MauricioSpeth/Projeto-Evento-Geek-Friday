'use client';
import {useEffect} from 'react';

// Mantém o foco no diálogo e devolve-o ao acionador quando ele é fechado.
export function useDialogKeyboard(open:boolean,onClose:()=>void){
 useEffect(()=>{
  if(!open)return;
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const dialog=document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
  if(!dialog)return;
  const focusable=()=>Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex]'))
   .filter(el=>el.tabIndex>=0&&el.getClientRects().length>0&&el.getAttribute('aria-hidden')!=='true');
  dialog.tabIndex=-1;
  (focusable()[0]||dialog).focus();
  function keydown(event:KeyboardEvent){
   // Um dropdown aberto trata primeiro o próprio Escape.
   if(event.defaultPrevented)return;
   if(event.key==='Escape'){event.preventDefault();onClose();return;}
   if(event.key!=='Tab')return;
   const items=focusable(),first=items[0],last=items[items.length-1];
   if(!first){event.preventDefault();dialog!.focus();return;}
   const active=document.activeElement;
   if(event.shiftKey&&(active===first||!items.includes(active as HTMLElement))){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&(active===last||!items.includes(active as HTMLElement))){event.preventDefault();first.focus();}
  }
  document.addEventListener('keydown',keydown);
  return()=>{document.removeEventListener('keydown',keydown);if(previous?.isConnected)previous.focus();};
 },[open,onClose]);
}
