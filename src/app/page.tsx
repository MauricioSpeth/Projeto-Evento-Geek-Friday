import Link from 'next/link';
export default function Home() { return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24}}><div className="cartao" style={{padding:32,textAlign:'center'}}><h1>Geek Friday</h1><p>Para participar, escaneie o QR Code disponível no evento.</p><p><Link href="/login">Área da organização</Link></p></div></main>; }
