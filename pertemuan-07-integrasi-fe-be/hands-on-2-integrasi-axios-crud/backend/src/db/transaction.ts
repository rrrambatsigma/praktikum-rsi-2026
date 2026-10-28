import sql from 'mssql';
import { getPool } from './pool.ts';

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
    await transaction.rollback().catch(() => undefined);
    throw error;
  }
}
