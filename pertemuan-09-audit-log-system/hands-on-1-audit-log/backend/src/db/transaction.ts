import sql from 'mssql';
import { getPool } from './pool.ts';

/**
 * Menjalankan beberapa query dalam satu transaksi.
 *
 * Callback menerima `transaction`; repository membuat request baru dari
 * transaksi tersebut agar setiap query ikut transaksi. Jika callback melempar
 * error, seluruh perubahan di-rollback sehingga mutasi bisnis dan catatan
 * audit tidak pernah terpisah.
 */
export async function withTransaction<T>(
  work: (transaction: sql.Transaction) => Promise<T>,
): Promise<T> {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const result = await work(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    try {
      await transaction.rollback();
    } catch {
      // Transaksi mungkin sudah otomatis rollback oleh SQL Server.
    }

    throw error;
  }
}
