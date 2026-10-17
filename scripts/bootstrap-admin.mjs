import dotenv from 'dotenv';
import pg from 'pg';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { poolOptions } from './pg-config.mjs';

dotenv.config({ path: '.env.local', override: true });
const user = 'admin'; // Administrador master fixo; não promover outras contas.
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
if (!/^[A-Za-z0-9._-]{3,40}$/.test(user) || !password) {
  console.error('Defina BOOTSTRAP_ADMIN_USER e BOOTSTRAP_ADMIN_PASSWORD em .env.local.');
  process.exit(1);
}
const salt = randomBytes(16).toString('hex');
const digest = scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex');
// A senha existente deve ser comprovada para promover uma conta já criada.
function confereSenha(senha, hashArmazenado) {
  const partes = (hashArmazenado || '').split('$');
  if (partes.length !== 3 || partes[0] !== 'scrypt' || !/^[0-9a-f]+$/i.test(partes[1]) || !/^[0-9a-f]{128}$/i.test(partes[2])) return false;
  const candidato = scryptSync(senha, Buffer.from(partes[1], 'hex'), 64);
  return timingSafeEqual(candidato, Buffer.from(partes[2], 'hex'));
}
const pool = new pg.Pool(poolOptions());
try {
  const existeGeral = await pool.query("SELECT 1 FROM admins WHERE papel='geral' LIMIT 1");
  const existed = await pool.query('SELECT id,usuario,senha_hash,papel FROM admins WHERE lower(usuario)=lower($1)', [user]);
  if (existed.rowCount) {
    const conta = existed.rows[0];
    if (!confereSenha(password, conta.senha_hash)) {
      console.error('A senha do administrador existente não confere. Nenhuma permissão foi modificada.');
      process.exitCode = 1;
    } else if (conta.papel === 'geral') {
      console.log('Administrador geral já configurado. Nenhuma senha alterada.');
    } else if (existeGeral.rowCount) {
      console.log('Já existe um administrador geral. Nenhuma permissão modificada.');
    } else {
      await pool.query("UPDATE admins SET papel='geral' WHERE id=$1 AND papel='admin'", [conta.id]);
      console.log(`Conta ${conta.usuario} promovida a administrador geral; senha preservada.`);
    }
  } else if (existeGeral.rowCount) {
    console.error('Já existe um administrador geral. Crie outros administradores pelo painel.');
    process.exitCode = 1;
  } else if (password.length < 12) {
    console.error('Para uma conta NOVA, use senha com pelo menos 12 caracteres.');
    process.exitCode = 1;
  } else {
    await pool.query("INSERT INTO admins(usuario,senha_hash,papel) VALUES($1,$2,'geral')", [user, `scrypt$${salt}$${digest}`]);
    console.log(`Administrador geral ${user} criado com sucesso.`);
  }
} catch (e) {
  console.error('Falha:', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
