import { createHash,createHmac,randomBytes,timingSafeEqual,scryptSync } from 'node:crypto';
import type { NextRequest } from 'next/server';
export const adminCookie='geek_admin';
export const deviceCookie='geek_dispositivo';
export const qrSessionCookie='geek_sessao';
export const COOKIE_8H=8*60*60;
const DEVICE_400D=400*24*60*60;
function secret():string {const s=process.env.APP_SECRET||'';if(s.length<32)throw new Error('Defina APP_SECRET com 32+ caracteres no .env.local');return s;}
function deviceSecret():string {const s=process.env.DEVICE_COOKIE_SECRET || process.env.APP_SECRET || '';if(s.length<32)throw new Error('Defina DEVICE_COOKIE_SECRET com 32+ caracteres no .env.local');return s;}
function deviceHmac(message:string){return createHmac('sha256',deviceSecret()).update(message).digest('hex');}
export function hash(value:string){return createHash('sha256').update(value).digest('hex');}
export function hmac(purpose:string,value:string){return createHmac('sha256',secret()).update(`${purpose}:${value}`).digest('hex');}
export function token(){return randomBytes(32).toString('hex');}
export function secureCookie(){return (process.env.PUBLIC_URL||'').startsWith('https://');}
export function cookieOptions(maxAge:number){return {httpOnly:true,secure:secureCookie(),sameSite:'lax' as const,path:'/',maxAge};}
export const deviceOptions=()=>cookieOptions(DEVICE_400D);
export function deviceValue(id=token()) {return `${id}.${deviceHmac(`cookie:${id}`)}`;}
export function deviceHash(value:string|undefined):string|null {
 if(!value)return null;
 const m=/^([a-f0-9]{64})\.([a-f0-9]{64})$/.exec(value);if(!m)return null;
 const expected=Buffer.from(deviceHmac(`cookie:${m[1]}`),'hex');const actual=Buffer.from(m[2],'hex');
 return actual.length===expected.length&&timingSafeEqual(actual,expected)?deviceHmac(`db:${m[1]}`):null;
}
export function passwordHash(password:string,salt=randomBytes(16).toString('hex')){return `scrypt$${salt}$${scryptSync(password,Buffer.from(salt,'hex'),64).toString('hex')}`;}
export function passwordMatches(password:string,stored:string):boolean {
 try {const [kind,salt,digest]=stored.split('$');if(kind!=='scrypt'||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{128}$/.test(digest))return false;
 const actual=scryptSync(password,Buffer.from(salt,'hex'),64),wanted=Buffer.from(digest,'hex');return timingSafeEqual(actual,wanted);
 }catch{return false;}
}
export function requestOriginAllowed(request:NextRequest):boolean{
 const origin=request.headers.get('origin');
 if(!origin)return true; // non-browser requests still require server-side authorization.
 const expected=process.env.PUBLIC_URL?new URL(process.env.PUBLIC_URL).origin:new URL(request.url).origin;
 return origin===expected;
}
export function getBaseUrl(request:NextRequest){return (process.env.PUBLIC_URL||new URL(request.url).origin).replace(/\/$/,'');}
export function jsonError(message:string,status:number){return Response.json({mensagem:message},{status,headers:{'Cache-Control':'no-store'}});}
export function duplicateMessage(error:unknown){const e=error as {code?:string,constraint?:string};
 if(e?.code!=='23505')return null;
 if(e.constraint==='participantes_nome_tipo_unico')return 'Já existe um cadastro com esse nome e tipo.';
 if(e.constraint==='dispositivos_cadastrados_pkey')return 'Cadastro já realizado.';
 return 'Cadastro duplicado.';
}
