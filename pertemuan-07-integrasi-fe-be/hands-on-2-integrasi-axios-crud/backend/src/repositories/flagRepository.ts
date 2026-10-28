import sql from 'mssql';
import { createRequest } from '../db/request.ts';
import type { FlagStatus } from '../dtos/flagDto.ts';

export interface FlagRow {
  id: number;
  reviewId: number;
  reportedBy: number;
  reporterName: string;
  reviewComment: string | null;
  stallId: number;
  stallName: string;
  reason: string | null;
  status: FlagStatus;
  createdAt: Date | null;
}

const flagSelect = `
  SELECT
    f.id,
    f.review_id AS reviewId,
    f.reported_by AS reportedBy,
    u.name AS reporterName,
    r.comment AS reviewComment,
    r.stall_id AS stallId,
    s.name AS stallName,
    f.reason,
    f.status,
    f.created_at AS createdAt
  FROM dbo.FLAGS f
  INNER JOIN dbo.USERS u ON u.id = f.reported_by
  INNER JOIN dbo.REVIEWS r ON r.id = f.review_id
  INNER JOIN dbo.STALLS s ON s.id = r.stall_id
`;

export class FlagRepository {
  async create(
    reviewId: number,
    reportedBy: number,
    reason: string | null,
    transaction?: sql.Transaction,
  ): Promise<FlagRow | null> {
    const request = await createRequest(transaction);
    const result = await request
      .input('reviewId', sql.Int, reviewId)
      .input('reportedBy', sql.Int, reportedBy)
      .input('reason', sql.NVarChar(255), reason)
      .query<{ id: number }>(`
        INSERT INTO dbo.FLAGS (review_id, reported_by, reason)
        OUTPUT INSERTED.id
        VALUES (@reviewId, @reportedBy, @reason)
      `);

    const id = result.recordset[0]?.id;
    return id ? this.findById(id) : null;
  }

  async findById(id: number): Promise<FlagRow | null> {
    const request = await createRequest();
    const result = await request
      .input('id', sql.Int, id)
      .query<FlagRow>(`${flagSelect} WHERE f.id = @id`);

    return result.recordset[0] ?? null;
  }

  async findAll(status?: FlagStatus): Promise<FlagRow[]> {
    const request = await createRequest();
    const result = await request
      .input('status', sql.NVarChar(20), status ?? null)
      .query<FlagRow>(`
        ${flagSelect}
        WHERE (@status IS NULL OR f.status = @status)
        ORDER BY f.created_at DESC, f.id DESC
      `);

    return result.recordset;
  }

  async updateStatus(
    id: number,
    status: Exclude<FlagStatus, 'pending'>,
    transaction?: sql.Transaction,
  ): Promise<FlagRow | null> {
    const request = await createRequest(transaction);
    const result = await request
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar(20), status)
      .query<{ id: number }>(`
        UPDATE dbo.FLAGS
        SET status = @status
        OUTPUT INSERTED.id
        WHERE id = @id
      `);

    const updatedId = result.recordset[0]?.id;
    return updatedId ? this.findById(updatedId) : null;
  }

  async removeByReviewId(reviewId: number, transaction?: sql.Transaction): Promise<void> {
    const request = await createRequest(transaction);
    await request.input('reviewId', sql.Int, reviewId).query('DELETE FROM dbo.FLAGS WHERE review_id = @reviewId');
  }
}
