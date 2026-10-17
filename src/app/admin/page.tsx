import {redirect} from 'next/navigation';
import {getPageAdmin} from '@/lib/auth';
import AdminPanel from '@/components/AdminPanel';
import AdminPresenca from '@/components/AdminPresenca';
export const dynamic='force-dynamic';
export default async function AdminPage(){const admin=await getPageAdmin();if(!admin)redirect('/login');return <><AdminPanel username={admin.usuario} isGeral={admin.papel==='geral'&&admin.usuario.toLowerCase()==='admin'}/><AdminPresenca/></>;}
