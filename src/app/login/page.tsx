import LoginForm from '@/components/LoginForm';
export default async function Login({searchParams}:{searchParams:Promise<{next?:string}>}){const params=await searchParams;return <LoginForm next={params.next==='/qr'?'/qr':'/admin'}/>;}
