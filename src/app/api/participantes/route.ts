import {NextRequest} from 'next/server';
import {getAdmin} from '@/lib/auth';
import {query,transaction} from '@/lib/db';
import {deviceHash,deviceCookie,qrSessionCookie,hash,jsonError,requestOriginAllowed,duplicateMessage} from '@/lib/security';
import {validarParticipante,type Participante} from '@/lib/types';
import {bloquearConfiguracao,exigirEventoAtivo,sessaoDaGeracaoAtual} from '@/lib/evento';
export const runtime='nodejs';
export async function GET(request:NextRequest){
 try {if(!await getAdmin(request))return jsonError('Acesso não autorizado.',401);
  const result=await query<Participante>('SELECT * FROM participantes ORDER BY id DESC');return Response.json(result.rows,{headers:{'Cache-Control':'no-store'}});
 }catch(error){console.error(error);return jsonError('Erro ao listar participantes.',500);}
}
export async function POST(request:NextRequest){
 if(!requestOriginAllowed(request))return jsonError('Origem não autorizada.',403);
 try{
  const body=await request.json();const validacao=validarParticipante(body);if('erro' in validacao)return jsonError(validacao.erro,400);
  const admin=await getAdmin(request);
  const devHash=deviceHash(request.cookies.get(deviceCookie)?.value);
  const rawSession=request.cookies.get(qrSessionCookie)?.value;
  if(!admin&&(!devHash||!rawSession||!/^[a-f0-9]{64}$/.test(rawSession)))return jsonError('Escaneie o QR antes de cadastrar.',403);
  // A transação garante que o registro e o bloqueio do navegador sejam indivisíveis.
  const novo=await transaction(async client=>{
   const cfg=await bloquearConfiguracao(client);
   exigirEventoAtivo(cfg);
   if(!admin){
    const session=await client.query<{device_hash:string;usado:boolean;expira_em:Date;geracao_atividade:string}>(
      'SELECT device_hash,usado,expira_em,geracao_atividade::text AS geracao_atividade FROM qr_sessions WHERE token_hash=$1 FOR UPDATE',[hash(rawSession!)]);
    const s=session.rows[0];
    if(!s||s.usado||s.device_hash!==devHash||!sessaoDaGeracaoAtual(s,cfg)||new Date(s.expira_em).getTime()<=Date.now())throw Object.assign(new Error('Sessão encerrada ou inválida.'),{httpStatus:403});
    const prior=await client.query('SELECT 1 FROM dispositivos_cadastrados WHERE device_hash=$1',[devHash]);
    if(prior.rowCount)throw Object.assign(new Error('Cadastro já realizado.'),{httpStatus:409});
   }
   const {nome,tipo,curso,periodo}=validacao.valor;
   const inserted=await client.query<Participante>(`INSERT INTO participantes(nome,tipo,curso,periodo,origem_cadastro,admin_criador_id)
     VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[nome,tipo,curso,periodo,admin?'admin':'publico',admin?.id||null]);
   if(!admin){
    await client.query('INSERT INTO dispositivos_cadastrados(device_hash,participante_id) VALUES($1,$2)',[devHash,inserted.rows[0].id]);
    await client.query('UPDATE qr_sessions SET usado=TRUE WHERE token_hash=$1',[hash(rawSession!)]);
   }
   return inserted.rows[0];
  });
  return Response.json(novo,{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(error){
  const duplicate=duplicateMessage(error);if(duplicate)return jsonError(duplicate,409);
  const e=error as {httpStatus?:number,message?:string};if(e.httpStatus)return jsonError(e.message||'Sessão inválida.',e.httpStatus);
  console.error('Falha no cadastro:',error);return jsonError('Erro ao cadastrar participante.',500);
 }
}
