import sql from 'mssql';
import { getPool } from './pool.ts';

export async function createRequest(transaction?: sql.Transaction): Promise<sql.Request> {
  if (transaction) {
    return new sql.Request(transaction);
  }

  const pool = await getPool();
  return pool.request();
}
