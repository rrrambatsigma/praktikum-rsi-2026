import sql from 'mssql';
import { createRequest } from '../db/request.ts';

export interface MenuRow {
  id: number;
  stallId: number;
  stallName: string;
  stallOwnerId: number;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface MenuInput {
  stallId: number;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface FindMenusParams {
  stallId?: number;
  search?: string;
  available?: boolean;
}

const menuSelect = `
  SELECT
    m.id,
    m.stall_id AS stallId,
    s.name AS stallName,
    s.owner_id AS stallOwnerId,
    m.name,
    m.price,
    m.is_available AS isAvailable
  FROM dbo.MENU_ITEMS m
  INNER JOIN dbo.STALLS s ON s.id = m.stall_id
`;

function normalizeRow(row: MenuRow): MenuRow {
  return {
    ...row,
    price: Number(row.price),
    isAvailable: Boolean(row.isAvailable),
  };
}

export class MenuRepository {
  async findAll(params: FindMenusParams = {}): Promise<MenuRow[]> {
    const request = await createRequest();
    const result = await request
      .input('stallId', sql.Int, params.stallId ?? null)
      .input('search', sql.NVarChar(100), params.search ?? null)
      .input('available', sql.Bit, params.available ?? null)
      .query<MenuRow>(`
        ${menuSelect}
        WHERE (@stallId IS NULL OR m.stall_id = @stallId)
          AND (
            @search IS NULL
            OR m.name LIKE '%' + @search + '%'
            OR s.name LIKE '%' + @search + '%'
          )
          AND (@available IS NULL OR m.is_available = @available)
        ORDER BY s.name, m.name
      `);

    return result.recordset.map(normalizeRow);
  }

  async findById(id: number): Promise<MenuRow | null> {
    const request = await createRequest();
    const result = await request
      .input('id', sql.Int, id)
      .query<MenuRow>(`${menuSelect} WHERE m.id = @id`);

    const row = result.recordset[0];
    return row ? normalizeRow(row) : null;
  }

  async create(input: MenuInput): Promise<MenuRow | null> {
    const request = await createRequest();
    const result = await request
      .input('stallId', sql.Int, input.stallId)
      .input('name', sql.NVarChar(100), input.name)
      .input('price', sql.Int, input.price)
      .input('isAvailable', sql.Bit, input.isAvailable)
      .query<{ id: number }>(`
        INSERT INTO dbo.MENU_ITEMS (stall_id, name, price, is_available)
        OUTPUT INSERTED.id
        VALUES (@stallId, @name, @price, @isAvailable)
      `);

    const id = result.recordset[0]?.id;
    return id ? this.findById(id) : null;
  }

  async update(id: number, input: MenuInput): Promise<MenuRow | null> {
    const request = await createRequest();
    const result = await request
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

    const updatedId = result.recordset[0]?.id;
    return updatedId ? this.findById(updatedId) : null;
  }

  async remove(id: number): Promise<boolean> {
    const request = await createRequest();
    const result = await request
      .input('id', sql.Int, id)
      .query('DELETE FROM dbo.MENU_ITEMS WHERE id = @id');

    return result.rowsAffected[0] > 0;
  }
}
