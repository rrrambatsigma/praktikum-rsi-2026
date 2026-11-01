import sql from 'mssql';
import { getPool } from '../db/pool.ts';
import type { MenuCategory } from '../dtos/menuDto.ts';
import type { CreateMenuInput } from '../schemas/menuSchema.ts';

export interface MenuRow {
  id: number;
  stallId: number;
  stallName: string;
  name: string;
  category: MenuCategory | null;
  price: number;
  description: string | null;
  isAvailable: boolean;
}

const menuSelect = `
  SELECT
    m.id,
    m.stall_id AS stallId,
    s.name AS stallName,
    m.name,
    m.category,
    m.price,
    m.description,
    m.is_available AS isAvailable
  FROM dbo.MENU_ITEMS m
  INNER JOIN dbo.STALLS s ON s.id = m.stall_id
`;

function toCategory(value: unknown): MenuCategory | null {
  if (value === 'makanan' || value === 'minuman' || value === 'camilan') {
    return value;
  }

  return null;
}

function normalizeRow(row: MenuRow): MenuRow {
  return {
    ...row,
    category: toCategory(row.category),
    price: Number(row.price),
    description: row.description ?? null,
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

  async create(input: CreateMenuInput): Promise<MenuRow | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('stallId', sql.Int, input.stallId)
      .input('name', sql.NVarChar(100), input.name)
      .input('category', sql.NVarChar(20), input.category)
      .input('price', sql.Int, input.price)
      .input('description', sql.NVarChar(255), input.description || null)
      .input('isAvailable', sql.Bit, input.isAvailable)
      .query<{ id: number }>(`
        INSERT INTO dbo.MENU_ITEMS
          (stall_id, name, category, price, description, is_available)
        OUTPUT INSERTED.id
        VALUES
          (@stallId, @name, @category, @price, @description, @isAvailable)
      `);

    const createdId = result.recordset[0]?.id;
    return createdId ? this.findById(createdId) : null;
  }
}
