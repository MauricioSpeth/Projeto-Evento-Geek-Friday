import {redirect} from 'next/navigation';
import {getPageAdmin} from '@/lib/auth';
import QRDisplay from '@/components/QRDisplay';
export const dynamic='force-dynamic';
export default async function QRPage(){if(!await getPageAdmin())redirect('/login?next=/qr');return <QRDisplay/>;}
