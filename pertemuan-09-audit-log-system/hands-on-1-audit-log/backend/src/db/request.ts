import sql from 'mssql';
import { getPool } from './pool.ts';

/**
 * Membuat request baru. `transaction` dipakai saat operasi harus ikut
 * transaksi mutasi bisnis; tanpa itu request memakai pool biasa.
 */
export async function createRequest(
  transaction?: sql.Transaction,
): Promise<sql.Request> {
  if (transaction) {
    return new sql.Request(transaction);
  }

  const pool = await getPool();
  return pool.request();
}
