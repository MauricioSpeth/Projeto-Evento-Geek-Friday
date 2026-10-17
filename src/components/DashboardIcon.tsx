import type {SVGProps} from 'react';

export type DashboardIconName = 'menu'|'users'|'graduation'|'teacher'|'visitors'|'qr'|'plus'|'logout'|'trash'|'pencil'|'database'|'search'|'calendar'|'user'|'lock'|'eye'|'eye-off'|'alert'|'crown'|'check';
type Props = SVGProps<SVGSVGElement> & {name:DashboardIconName; size?:number};

/** Ícones vetoriais locais: sem dependências externas ou carregamento de imagens. */
export default function DashboardIcon({name,size=20,...props}:Props){
 const base={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const, 'aria-hidden':true as const,...props};
 switch(name){
  case 'menu':return <svg {...base}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
  case 'users':return <svg {...base}><path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 20v-2a4 4 0 0 0-3-3.87M16 2.13a4 4 0 0 1 0 7.75"/></svg>;
  case 'graduation':return <svg {...base}><path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v6c3 3 9 3 12 0v-6M22 9v7"/></svg>;
  case 'teacher':return <svg {...base}><circle cx="8" cy="7" r="3"/><path d="M2 20v-3a6 6 0 0 1 9.6-4.8M14 5h8v9h-4M13 19l3 3 6-7"/></svg>;
  case 'visitors':return <svg {...base}><circle cx="8" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2 20v-3a6 6 0 0 1 12 0v3H2ZM16 14c3.3 0 6 2.4 6 5.5V20h-5"/></svg>;
  case 'qr':return <svg {...base}><rect x="2" y="2" width="7" height="7" rx="1"/><rect x="5" y="5" width="1" height="1"/><rect x="15" y="2" width="7" height="7" rx="1"/><rect x="18" y="5" width="1" height="1"/><rect x="2" y="15" width="7" height="7" rx="1"/><rect x="5" y="18" width="1" height="1"/><path d="M14 14h3v3h-3zM21 14v3h-2M14 21h3M19 20h3M21 18v2"/></svg>;
  case 'plus':return <svg {...base}><path d="M12 5v14M5 12h14"/></svg>;
  case 'logout':return <svg {...base}><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6"/></svg>;
  case 'trash':return <svg {...base}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>;
  case 'pencil':return <svg {...base}><path d="m15 5 4 4M3 21l4-.7L20.2 7.1a2.5 2.5 0 0 0-3.5-3.5L3.5 16.8 3 21Z"/></svg>;
  case 'database':return <svg {...base}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/></svg>;
  case 'search':return <svg {...base}><circle cx="10.8" cy="10.8" r="7.2"/><path d="m16 16 5 5"/></svg>;
  case 'calendar':return <svg {...base}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>;
  case 'user':return <svg {...base}><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2H4Z"/></svg>;
  case 'lock':return <svg {...base}><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>;
  case 'eye':return <svg {...base}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>;
  case 'eye-off':return <svg {...base}><path d="m3 3 18 18M10 5.2a12 12 0 0 1 2-.2c6 0 10 7 10 7a16 16 0 0 1-3 3.5M6 6.5C3.5 8.4 2 12 2 12s4 7 10 7a10 10 0 0 0 3.4-.6"/></svg>;
  case 'alert':return <svg {...base}><circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 17h.01"/></svg>;
  case 'crown':return <svg {...base}><path d="M2 7l5 4 5-7 5 7 5-4-2 12H4L2 7Z"/></svg>;
  case 'check':return <svg {...base}><path d="m4 12 5 5L20 6"/></svg>;
 }
}
