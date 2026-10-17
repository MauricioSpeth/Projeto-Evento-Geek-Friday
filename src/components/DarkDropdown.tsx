'use client';

import {useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';

type Option={value:string;label:string};
type Props={
 id:string;
 value:string;
 options:Option[];
 placeholder:string;
 onChange:(value:string)=>void;
 required?:boolean;
 disabled?:boolean;
};
type Geometry={left:number;top:number;width:number;maxHeight:number};

/** Lista personalizada: mantém a validação nativa do formulário, mas a interface é escura. */
export default function DarkDropdown({id,value,options,placeholder,onChange,required=false,disabled=false}:Props){
 const [open,setOpen]=useState(false);
 const [active,setActive]=useState(0);
 const [invalid,setInvalid]=useState(false);
 const [geometry,setGeometry]=useState<Geometry|null>(null);
 const rootRef=useRef<HTMLDivElement>(null);
 const buttonRef=useRef<HTMLButtonElement>(null);
 const listRef=useRef<HTMLUListElement>(null);
 const prefix=useId().replace(/:/g,'');
 const listId=`${prefix}-lista`;
 const selectedIndex=options.findIndex(option=>option.value===value);
 const selected=options[selectedIndex]?.label||value||placeholder;

 function positionList(){
  const rect=buttonRef.current?.getBoundingClientRect();if(!rect)return;
  const below=window.innerHeight-rect.bottom-10;
  const above=rect.top-10;
  const estimated=Math.min(300,options.length*45+12);
  const flip=below<Math.min(220,estimated)&&above>below;
  const maxHeight=Math.max(80,Math.min(300,flip?above:below));
  const top=flip?Math.max(8,rect.top-maxHeight-6):rect.bottom+6;
  setGeometry({left:Math.max(8,rect.left),top,width:Math.min(rect.width,window.innerWidth-16),maxHeight});
 }
 function show(){
  if(disabled)return;
  setActive(Math.max(0,selectedIndex));
  positionList();
  setOpen(true);
 }
 function choose(index:number){
  const item=options[index];if(!item)return;
  onChange(item.value);setInvalid(false);setOpen(false);
  buttonRef.current?.focus();
 }
 useEffect(()=>{
  if(!open)return;
  function outside(e:PointerEvent){
   const target=e.target as Node;
   if(!rootRef.current?.contains(target)&&!listRef.current?.contains(target))setOpen(false);
  }
  function update(){positionList();}
  document.addEventListener('pointerdown',outside);
  window.addEventListener('resize',update);
  window.addEventListener('scroll',update,true);
  return()=>{
   document.removeEventListener('pointerdown',outside);
   window.removeEventListener('resize',update);
   window.removeEventListener('scroll',update,true);
  };
 },[open,options.length]);
 useEffect(()=>{if(disabled)setOpen(false);},[disabled]);
 useEffect(()=>{
  if(!open)return;
  listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({block:'nearest'});
 },[open,active]);
 function keydown(e:React.KeyboardEvent<HTMLButtonElement>){
  if(disabled)return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
   e.preventDefault();
   if(!open){show();return;}
   setActive(i=>(i+(e.key==='ArrowDown'?1:-1)+options.length)%options.length);
  }else if(e.key==='Home'&&open){e.preventDefault();setActive(0);
  }else if(e.key==='End'&&open){e.preventDefault();setActive(options.length-1);
  }else if(e.key==='Escape'&&open){e.preventDefault();setOpen(false);
  }else if(e.key==='Enter'||e.key===' '){e.preventDefault();if(open)choose(active);else show();
  }else if(e.key==='Tab'&&open){setOpen(false);
  }else if(e.key.length===1&&!e.ctrlKey&&!e.altKey&&!e.metaKey){
   const index=options.findIndex(o=>o.label.toLocaleLowerCase('pt-BR').startsWith(e.key.toLocaleLowerCase('pt-BR')));
   if(index>=0){e.preventDefault();if(!open)show();setActive(index);}
  }
 }
 return <div className="dropdown-escuro" ref={rootRef}>
  <button
   id={id} ref={buttonRef} type="button" className={`dropdown-escuro-botao${invalid?' dropdown-invalido':''}`}
   role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={open?listId:undefined}
   aria-activedescendant={open&&options[active]?`${prefix}-opcao-${active}`:undefined}
   aria-required={required} aria-invalid={invalid} disabled={disabled}
   onKeyDown={keydown} onClick={()=>open?setOpen(false):show()}
  ><span className={value?'':'dropdown-placeholder'}>{selected}</span><span className="dropdown-seta" aria-hidden="true">▾</span></button>
  {/* Select apenas para validação HTML5: não recebe foco ou cliques do usuário. */}
  <select className="dropdown-escuro-validacao" tabIndex={-1} aria-hidden="true" required={required} disabled={disabled}
   value={value} onChange={()=>{}} onInvalid={e=>{
    e.preventDefault();setInvalid(true);show();buttonRef.current?.focus();
   }}>
   <option value="">{placeholder}</option>
   {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
  {open&&geometry&&typeof document!=='undefined'&&createPortal(
   <ul id={listId} className="dropdown-escuro-lista" role="listbox" ref={listRef} aria-label={id.includes('periodo')?'Selecione o período':'Selecione o curso'}
    style={{left:geometry.left,top:geometry.top,width:geometry.width,maxHeight:geometry.maxHeight}}>
    {options.map((o,index)=><li id={`${prefix}-opcao-${index}`} data-index={index} role="option" aria-selected={value===o.value}
     key={o.value} className={`${index===active?'dropdown-ativo ':''}${value===o.value?'dropdown-selecionado':''}`.trim()}
     onMouseEnter={()=>setActive(index)} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(index)}>{o.label}</li>)}
   </ul>,document.body)}
 </div>;
}
