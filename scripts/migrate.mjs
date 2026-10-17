import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';
import { poolOptions } from './pg-config.mjs';

// Os scripts locais priorizam explicitamente o arquivo .env.local.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
const pool = new pg.Pool(poolOptions());
try {
  for (const file of ['sql/001_schema_nextjs.sql', 'sql/002_controle_evento.sql', 'sql/003_admin_geral_presenca.sql']) {
    await pool.query(fs.readFileSync(file, 'utf8'));
    console.log(`Migração aplicada: ${file}`);
  }
  console.log('Migração SQL concluída. Tabelas, controle do evento e permissões de Admin prontos.');
} catch (e) {
  console.error('Erro ao atualizar banco:', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
