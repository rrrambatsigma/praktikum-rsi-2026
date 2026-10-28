import sql from 'mssql';
import { getPool } from '../db/pool.ts';
import type { CreateMenuInput } from '../schemas/menuSchema.ts';

export interface MenuRow {
  id: number;
  stallId: number;
  stallName: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

const menuSelect = `
  SELECT
    m.id,
    m.stall_id AS stallId,
    s.name AS stallName,
    m.name,
    m.price,
    m.is_available AS isAvailable
  FROM dbo.MENU_ITEMS m
  INNER JOIN dbo.STALLS s ON s.id = m.stall_id
`;

function normalizeRow(row: MenuRow): MenuRow {
  return {
    ...row,
    isAvailable: Boolean(row.isAvailable),
  };
}

export class MenuRepository {
  async findAll(): Promise<MenuRow[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .query<MenuRow>(`${menuSelect} ORDER BY m.id DESC`);

    return result.recordset.map(normalizeRow);
  }

  async findById(id: number): Promise<MenuRow | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<MenuRow>(`${menuSelect} WHERE m.id = @id`);

    const row = result.recordset[0];
    return row ? normalizeRow(row) : null;
  }

  async create(input: CreateMenuInput): Promise<number | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('stallId', sql.Int, input.stallId)
      .input('name', sql.NVarChar(100), input.name)
      .input('price', sql.Int, input.price)
      .input('isAvailable', sql.Bit, input.isAvailable)
      .query<{ id: number }>(`
        INSERT INTO dbo.MENU_ITEMS (stall_id, name, price, is_available)
        OUTPUT INSERTED.id
        VALUES (@stallId, @name, @price, @isAvailable)
      `);

    return result.recordset[0]?.id ?? null;
  }

  async update(id: number, input: CreateMenuInput): Promise<number | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('stallId', sql.Int, input.stallId)
      .input('name', sql.NVarChar(100), input.name)
      .input('price', sql.Int, input.price)
      .input('isAvailable', sql.Bit, input.isAvailable)
      .query<{ id: number }>(`
        UPDATE dbo.MENU_ITEMS
        SET
          stall_id = @stallId,
          name = @name,
          price = @price,
          is_available = @isAvailable
        OUTPUT INSERTED.id
        WHERE id = @id
      `);

    return result.recordset[0]?.id ?? null;
  }

  async remove(id: number): Promise<boolean> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM dbo.MENU_ITEMS WHERE id = @id');

    return result.rowsAffected[0] > 0;
  }
}
