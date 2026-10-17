import {hmac,hash} from './security';
import {query} from './db';
import type {ConfiguracaoEvento} from './evento';
export const SESSION_TTL_MS=180000;
export function qrCurrent(config: Pick<ConfiguracaoEvento,'qr_tempo_segundos'|'qr_versao'> & {qr_inicio_em?: Date|string},now=Date.now()){
 const intervalo=config.qr_tempo_segundos*1000;
 // Ancorar o ciclo no momento da alteração dá um intervalo completo
 // (ex.: 20s) ao QR gerado imediatamente após salvar no painel.
 const inicio=config.qr_inicio_em?new Date(config.qr_inicio_em).getTime():0;
 const slot=Math.floor((now-inicio)/intervalo);
 return {value:hmac('qr-window',`${config.qr_versao}:${slot}`),expiresAt:inicio+(slot+1)*intervalo};
}
export function qrIsValid(value:string,config:Pick<ConfiguracaoEvento,'qr_tempo_segundos'|'qr_versao'> & {qr_inicio_em?: Date|string},now=Date.now()){
 return /^[0-9a-f]{64}$/.test(value)&&qrCurrent(config,now).value===value;
}
export async function deviceAlreadyRegistered(deviceHash:string){
 const result=await query('SELECT 1 FROM dispositivos_cadastrados WHERE device_hash=$1 LIMIT 1',[deviceHash]);
 return (result.rowCount??0)>0;
}
export async function qrSessionByToken(value:string|undefined){
 if(!value||!/^[a-f0-9]{64}$/.test(value))return null;
 const result=await query<{device_hash:string;expira_em:Date;usado:boolean;geracao_atividade:string}>(
  'SELECT device_hash,expira_em,usado,geracao_atividade::text AS geracao_atividade FROM qr_sessions WHERE token_hash=$1 LIMIT 1',[hash(value)]);
 return result.rows[0]||null;
}
