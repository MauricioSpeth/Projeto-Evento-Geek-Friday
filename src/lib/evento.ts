import type { PoolClient } from 'pg';
import { query } from './db';

export type ConfiguracaoEvento = {
 ativo: boolean;
 qr_tempo_segundos: number;
 qr_versao: string;
 qr_inicio_em: Date;
 geracao_atividade: string;
 atualizado_em: Date;
 atualizado_por: number|null;
};

const FIELDS='ativo,qr_tempo_segundos,qr_versao::text AS qr_versao,qr_inicio_em,geracao_atividade::text AS geracao_atividade,atualizado_em,atualizado_por';

export function validarTempoQR(input:unknown):number|null {
 return typeof input === 'number' && Number.isInteger(input) && input>=1 && input<=3600 ? input : null;
}

export async function lerConfiguracao():Promise<ConfiguracaoEvento> {
 const result=await query<ConfiguracaoEvento>(`SELECT ${FIELDS} FROM configuracoes_evento WHERE id=1`);
 if(!result.rows[0])throw new Error('Configuração do evento não encontrada. Execute npm run db:migrate.');
 return result.rows[0];
}

// FOR SHARE mantém a chave de configuração travada até o COMMIT da inscrição;
// o interruptor só conclui depois das inscrições que já estavam em andamento.
export async function bloquearConfiguracao(client:PoolClient):Promise<ConfiguracaoEvento>{
 const result=await client.query<ConfiguracaoEvento>(`SELECT ${FIELDS} FROM configuracoes_evento WHERE id=1 FOR SHARE`);
 if(!result.rows[0])throw new Error('Configuração do evento não encontrada. Execute npm run db:migrate.');
 return result.rows[0];
}

export function exigirEventoAtivo(config:Pick<ConfiguracaoEvento,'ativo'>){
 if(!config.ativo)throw Object.assign(new Error('Sistema desligado pela organização. Nenhum cadastro ou alteração é permitido.'),{httpStatus:423});
}

export function sessaoDaGeracaoAtual(session: {geracao_atividade:string}, config: Pick<ConfiguracaoEvento,'geracao_atividade'>){
 return String(session.geracao_atividade)===String(config.geracao_atividade);
}
