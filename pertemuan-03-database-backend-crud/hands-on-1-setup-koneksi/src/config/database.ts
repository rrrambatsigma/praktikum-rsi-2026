import 'dotenv/config';
import sql from 'mssql';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} belum diisi. Salin .env.example ke .env.`);
  }
  return value;
}

const config: sql.config = {
  server: process.env.DB_SERVER ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 1433),
  user: required('DB_USER'),
  password: required('DB_PASSWORD'),
  database: required('DB_NAME'),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

// Membuat (sekali) lalu memakai kembali connection pool yang sama.
export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .catch((error) => {
        poolPromise = null;
        throw error;
      });
  }
  return poolPromise;
}

export async function closePool(): Promise<void> {
  if (!poolPromise) return;
  const pool = await poolPromise;
  await pool.close();
  poolPromise = null;
}
