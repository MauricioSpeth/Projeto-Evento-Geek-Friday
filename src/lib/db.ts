import {
  Pool,
  type PoolClient,
  type QueryResult,
  type QueryResultRow
} from 'pg';

declare global {
  var __geekPool: Pool | undefined;
}

function criarPool(): Pool {
  const config = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'geek_friday'
      };

  // Limita a quantidade de conexões por instância.
  const solicitado = Number(process.env.DB_POOL_MAX ?? 10);

  const max =
    Number.isInteger(solicitado) &&
    solicitado >= 1 &&
    solicitado <= 20
      ? solicitado
      : 10;

  // Configuração segura do SSL.
  let ssl: {
    rejectUnauthorized: boolean;
    ca?: string;
  } | undefined;

  if (process.env.DB_SSL === 'true') {
    ssl = {
      rejectUnauthorized: true
    };

    // Certificado CA fornecido pelo Supabase.
    const certificadoBase64 =
      process.env.DB_CA_CERT_BASE64?.trim();

    if (certificadoBase64) {
      const certificado = Buffer.from(
        certificadoBase64,
        'base64'
      ).toString('utf8');

      if (!certificado.includes('-----BEGIN CERTIFICATE-----')) {
        throw new Error(
          'DB_CA_CERT_BASE64 não contém um certificado PEM válido.'
        );
      }

      ssl.ca = certificado;
    }
  }

  return new Pool({
    ...config,
    ssl,
    max
  });
}

export const pool =
  globalThis.__geekPool ?? criarPool();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__geekPool = pool;
}

export const query = <
  T extends QueryResultRow = QueryResultRow
>(
  sql: string,
  params: unknown[] = []
): Promise<QueryResult<T>> => {
  return pool.query<T>(sql, params);
};

export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const value = await fn(client);

    await client.query('COMMIT');

    return value;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}