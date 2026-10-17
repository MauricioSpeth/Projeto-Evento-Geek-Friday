// Configuração compartilhada pelos scripts de migração e bootstrap.
// Uso: configure .env.local; não copie credenciais para este arquivo.
export function poolOptions() {
  const config = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'app_geek_demo',
      };
  if (process.env.DB_SSL !== 'true') return config;
  const base64 = process.env.DB_CA_CERT_BASE64?.trim();
  const ca = base64 ? Buffer.from(base64, 'base64').toString('utf8') : undefined;
  if (base64 && !ca.includes('-----BEGIN CERTIFICATE-----')) {
    throw new Error('DB_CA_CERT_BASE64 deve conter um certificado CA PEM válido.');
  }
  return { ...config, ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) } };
}
