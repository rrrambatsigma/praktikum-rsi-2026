import sql from 'mssql';
import { getPool } from '../db/pool.ts';
import type { StallDto } from '../dtos/stallDto.ts';

export class StallRepository {
  async findAll(): Promise<StallDto[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .query<StallDto>(`
        SELECT id, name, category, location
        FROM dbo.STALLS
        ORDER BY name ASC
      `);

    return result.recordset;
  }

  async findById(id: number): Promise<StallDto | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<StallDto>(`
        SELECT id, name, category, location
        FROM dbo.STALLS
        WHERE id = @id
      `);

    return result.recordset[0] ?? null;
  }
}
