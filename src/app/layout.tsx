import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Geek Friday • HallowGeek', description: 'Cadastro de participantes do evento' };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="pt-BR"><body>{children}</body></html>;}
