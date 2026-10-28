import sql from 'mssql';
import { createRequest } from '../db/request.ts';

export interface LikeRow {
  id: number;
  reviewId: number;
  userId: number;
  createdAt: Date | null;
}

export class LikeRepository {
  async findByReviewAndUser(reviewId: number, userId: number): Promise<LikeRow | null> {
    const request = await createRequest();
    const result = await request
      .input('reviewId', sql.Int, reviewId)
      .input('userId', sql.Int, userId)
      .query<LikeRow>(`
        SELECT id, review_id AS reviewId, user_id AS userId, created_at AS createdAt
        FROM dbo.LIKES
        WHERE review_id = @reviewId AND user_id = @userId
      `);

    return result.recordset[0] ?? null;
  }

  async create(reviewId: number, userId: number, transaction?: sql.Transaction): Promise<boolean> {
    const request = await createRequest(transaction);
    const result = await request
      .input('reviewId', sql.Int, reviewId)
      .input('userId', sql.Int, userId)
      .query(`
        INSERT INTO dbo.LIKES (review_id, user_id)
        VALUES (@reviewId, @userId)
      `);

    return result.rowsAffected[0] > 0;
  }

  async remove(reviewId: number, userId: number, transaction?: sql.Transaction): Promise<boolean> {
    const request = await createRequest(transaction);
    const result = await request
      .input('reviewId', sql.Int, reviewId)
      .input('userId', sql.Int, userId)
      .query('DELETE FROM dbo.LIKES WHERE review_id = @reviewId AND user_id = @userId');

    return result.rowsAffected[0] > 0;
  }

  async removeByReviewId(reviewId: number, transaction?: sql.Transaction): Promise<void> {
    const request = await createRequest(transaction);
    await request.input('reviewId', sql.Int, reviewId).query('DELETE FROM dbo.LIKES WHERE review_id = @reviewId');
  }

  async refreshReviewLikeCount(reviewId: number, transaction?: sql.Transaction): Promise<number> {
    const countRequest = await createRequest(transaction);
    const countResult = await countRequest
      .input('reviewId', sql.Int, reviewId)
      .query<{ total: number }>('SELECT COUNT(*) AS total FROM dbo.LIKES WHERE review_id = @reviewId');

    const total = Number(countResult.recordset[0]?.total ?? 0);

    const updateRequest = await createRequest(transaction);
    await updateRequest
      .input('reviewId', sql.Int, reviewId)
      .input('total', sql.Int, total)
      .query('UPDATE dbo.REVIEWS SET like_count = @total WHERE id = @reviewId');

    return total;
  }
}
