import sql from 'mssql';
import { getPool } from '../db/pool.ts';
import type { StallDto } from '../dtos/stallDto.ts';

interface StallRow {
  id: number;
  ownerId: number;
  name: string;
  category: string | null;
  location: string | null;
}

const stallSelect = `
  SELECT id, owner_id AS ownerId, name, category, location
  FROM dbo.STALLS
`;

export class StallRepository {
  async findAll(): Promise<StallDto[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .query<StallRow>(`${stallSelect} ORDER BY name`);

    return result.recordset;
  }

  /**
   * Hanya warung yang dimiliki user tertentu. Dipakai dashboard Owner supaya
   * form tambah menu tidak pernah menawarkan warung milik orang lain.
   */
  async findByOwnerId(ownerId: number): Promise<StallDto[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('ownerId', sql.Int, ownerId)
      .query<StallRow>(`${stallSelect} WHERE owner_id = @ownerId ORDER BY name`);

    return result.recordset;
  }

  async findById(id: number): Promise<StallDto | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<StallRow>(`${stallSelect} WHERE id = @id`);

    return result.recordset[0] ?? null;
  }
}
