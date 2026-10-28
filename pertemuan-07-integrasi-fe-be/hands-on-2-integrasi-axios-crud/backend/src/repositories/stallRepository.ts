import sql from 'mssql';
import { createRequest } from '../db/request.ts';
import { withTransaction } from '../db/transaction.ts';

export interface StallRow {
  id: number;
  ownerId: number;
  ownerName: string;
  name: string;
  category: string | null;
  location: string | null;
  description: string | null;
  avgRating: number | string;
  reviewCount: number;
  createdAt: Date | null;
}

export interface FindStallsParams {
  search?: string;
  category?: string;
}

export interface CreateStallInput {
  ownerId: number;
  name: string;
  category: string | null;
  location: string | null;
  description: string | null;
}

export interface UpdateStallInput extends CreateStallInput {
  id: number;
}

const stallSelect = `
  SELECT
    s.id,
    s.owner_id AS ownerId,
    u.name AS ownerName,
    s.name,
    s.category,
    s.location,
    s.description,
    s.avg_rating AS avgRating,
    s.review_count AS reviewCount,
    s.created_at AS createdAt
  FROM dbo.STALLS s
  INNER JOIN dbo.USERS u ON u.id = s.owner_id
`;

export class StallRepository {
  async findAll(params: FindStallsParams = {}): Promise<StallRow[]> {
    const request = await createRequest();
    const result = await request
      .input('search', sql.NVarChar(100), params.search ?? null)
      .input('category', sql.NVarChar(50), params.category ?? null)
      .query<StallRow>(`
        ${stallSelect}
        WHERE (@search IS NULL OR s.name LIKE '%' + @search + '%')
          AND (@category IS NULL OR s.category = @category)
        ORDER BY s.name
      `);

    return result.recordset;
  }

  async findById(id: number): Promise<StallRow | null> {
    const request = await createRequest();
    const result = await request
      .input('id', sql.Int, id)
      .query<StallRow>(`${stallSelect} WHERE s.id = @id`);

    return result.recordset[0] ?? null;
  }

  async create(input: CreateStallInput): Promise<StallRow | null> {
    const request = await createRequest();
    const result = await request
      .input('ownerId', sql.Int, input.ownerId)
      .input('name', sql.NVarChar(100), input.name)
      .input('category', sql.NVarChar(50), input.category)
      .input('location', sql.NVarChar(100), input.location)
      .input('description', sql.NVarChar(sql.MAX), input.description)
      .query<{ id: number }>(`
        INSERT INTO dbo.STALLS (owner_id, name, category, location, description)
        OUTPUT INSERTED.id
        VALUES (@ownerId, @name, @category, @location, @description)
      `);

    const id = result.recordset[0]?.id;
    return id ? this.findById(id) : null;
  }

  async update(input: UpdateStallInput): Promise<StallRow | null> {
    const request = await createRequest();
    const result = await request
      .input('id', sql.Int, input.id)
      .input('ownerId', sql.Int, input.ownerId)
      .input('name', sql.NVarChar(100), input.name)
      .input('category', sql.NVarChar(50), input.category)
      .input('location', sql.NVarChar(100), input.location)
      .input('description', sql.NVarChar(sql.MAX), input.description)
      .query<{ id: number }>(`
        UPDATE dbo.STALLS
        SET
          owner_id = @ownerId,
          name = @name,
          category = @category,
          location = @location,
          description = @description
        OUTPUT INSERTED.id
        WHERE id = @id
      `);

    const id = result.recordset[0]?.id;
    return id ? this.findById(id) : null;
  }

  async remove(id: number, transaction?: sql.Transaction): Promise<boolean> {
    const run = async (activeTransaction: sql.Transaction): Promise<boolean> => {
      const deleteFlags = new sql.Request(activeTransaction);
      await deleteFlags.input('id', sql.Int, id).query(`
        DELETE FROM dbo.FLAGS
        WHERE review_id IN (SELECT id FROM dbo.REVIEWS WHERE stall_id = @id)
      `);

      const deleteLikes = new sql.Request(activeTransaction);
      await deleteLikes.input('id', sql.Int, id).query(`
        DELETE FROM dbo.LIKES
        WHERE review_id IN (SELECT id FROM dbo.REVIEWS WHERE stall_id = @id)
      `);

      const deleteReviews = new sql.Request(activeTransaction);
      await deleteReviews
        .input('id', sql.Int, id)
        .query('DELETE FROM dbo.REVIEWS WHERE stall_id = @id');

      const deleteMenus = new sql.Request(activeTransaction);
      await deleteMenus
        .input('id', sql.Int, id)
        .query('DELETE FROM dbo.MENU_ITEMS WHERE stall_id = @id');

      const deleteStall = new sql.Request(activeTransaction);
      const result = await deleteStall
        .input('id', sql.Int, id)
        .query('DELETE FROM dbo.STALLS WHERE id = @id');

      return result.rowsAffected[0] > 0;
    };

    if (transaction) return run(transaction);
    return withTransaction(run);
  }
}
