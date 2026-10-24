import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable ${name} belum diisi. Salin .env.example ke .env.`);
  }

  return value;
}

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];

  if (!raw) return fallback;

  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} harus berupa angka positif.`);
  }

  return value;
}

export const env = {
  port: numberFromEnv('PORT', 3000),
  corsOrigin: process.env.CORS_ORIGIN?.trim() || 'http://localhost:5173',
  db: {
    server: process.env.DB_SERVER?.trim() || 'localhost',
    port: numberFromEnv('DB_PORT', 1433),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
};
