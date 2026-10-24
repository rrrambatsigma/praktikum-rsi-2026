import sql from 'mssql';
import { createRequest } from '../db/request.ts';
import type { UserRole } from '../types/user.ts';

export interface ReviewRow {
  id: number;
  stallId: number;
  stallName: string;
  userId: number;
  userName: string;
  rating: number;
  comment: string | null;
  likeCount: number;
  likedByMe: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateReviewInput {
  stallId: number;
  userId: number;
  rating: number;
  comment: string | null;
}

const reviewSelect = `
  SELECT
    r.id,
    r.stall_id AS stallId,
    s.name AS stallName,
    r.user_id AS userId,
    u.name AS userName,
    r.rating,
    r.comment,
    r.like_count AS likeCount,
    CASE
      WHEN @viewerId IS NOT NULL AND EXISTS (
        SELECT 1 FROM dbo.LIKES l
        WHERE l.review_id = r.id AND l.user_id = @viewerId
      ) THEN CAST(1 AS BIT)
      ELSE CAST(0 AS BIT)
    END AS likedByMe,
    r.created_at AS createdAt,
    r.updated_at AS updatedAt
  FROM dbo.REVIEWS r
  INNER JOIN dbo.STALLS s ON s.id = r.stall_id
  INNER JOIN dbo.USERS u ON u.id = r.user_id
`;

function normalizeRow(row: ReviewRow): ReviewRow {
  return {
    ...row,
    rating: Number(row.rating),
    likeCount: Number(row.likeCount),
    likedByMe: Boolean(row.likedByMe),
  };
}

export class ReviewRepository {
  async findByStall(stallId: number, viewerId?: number): Promise<ReviewRow[]> {
    const request = await createRequest();
    const result = await request
      .input('stallId', sql.Int, stallId)
      .input('viewerId', sql.Int, viewerId ?? null)
      .query<ReviewRow>(`
        ${reviewSelect}
        WHERE r.stall_id = @stallId
        ORDER BY r.created_at DESC, r.id DESC
      `);

    return result.recordset.map(normalizeRow);
  }

  async findByUser(userId: number): Promise<ReviewRow[]> {
    const request = await createRequest();
    const result = await request
      .input('viewerId', sql.Int, userId)
      .input('userId', sql.Int, userId)
      .query<ReviewRow>(`
        ${reviewSelect}
        WHERE r.user_id = @userId
        ORDER BY r.created_at DESC, r.id DESC
      `);

    return result.recordset.map(normalizeRow);
  }

  async findManaged(userId: number, role: UserRole): Promise<ReviewRow[]> {
    const request = await createRequest();
    request.input('viewerId', sql.Int, userId);

    let where = '';

    if (role === 'customer') {
      request.input('userId', sql.Int, userId);
      where = 'WHERE r.user_id = @userId';
    } else if (role === 'owner') {
      request.input('ownerId', sql.Int, userId);
      where = 'WHERE s.owner_id = @ownerId';
    }

    const result = await request.query<ReviewRow>(`
      ${reviewSelect}
      ${where}
      ORDER BY r.created_at DESC, r.id DESC
    `);

    return result.recordset.map(normalizeRow);
  }

  async findById(id: number, viewerId?: number, transaction?: sql.Transaction): Promise<ReviewRow | null> {
    const request = await createRequest(transaction);
    const result = await request
      .input('id', sql.Int, id)
      .input('viewerId', sql.Int, viewerId ?? null)
      .query<ReviewRow>(`${reviewSelect} WHERE r.id = @id`);

    const row = result.recordset[0];
    return row ? normalizeRow(row) : null;
  }

  async findByStallAndUser(stallId: number, userId: number): Promise<ReviewRow | null> {
    const request = await createRequest();
    const result = await request
      .input('stallId', sql.Int, stallId)
      .input('userId', sql.Int, userId)
      .input('viewerId', sql.Int, userId)
      .query<ReviewRow>(`
        ${reviewSelect}
        WHERE r.stall_id = @stallId AND r.user_id = @userId
      `);

    const row = result.recordset[0];
    return row ? normalizeRow(row) : null;
  }

  async create(input: CreateReviewInput, transaction?: sql.Transaction): Promise<number | null> {
    const request = await createRequest(transaction);
    const result = await request
      .input('stallId', sql.Int, input.stallId)
      .input('userId', sql.Int, input.userId)
      .input('rating', sql.Int, input.rating)
      .input('comment', sql.NVarChar(sql.MAX), input.comment)
      .query<{ id: number }>(`
        INSERT INTO dbo.REVIEWS (stall_id, user_id, rating, comment)
        OUTPUT INSERTED.id
        VALUES (@stallId, @userId, @rating, @comment)
      `);

    return result.recordset[0]?.id ?? null;
  }

  async update(
    id: number,
    rating: number,
    comment: string | null,
    transaction?: sql.Transaction,
  ): Promise<boolean> {
    const request = await createRequest(transaction);
    const result = await request
      .input('id', sql.Int, id)
      .input('rating', sql.Int, rating)
      .input('comment', sql.NVarChar(sql.MAX), comment)
      .query(`
        UPDATE dbo.REVIEWS
        SET rating = @rating, comment = @comment, updated_at = SYSDATETIME()
        WHERE id = @id
      `);

    return result.rowsAffected[0] > 0;
  }

  async remove(id: number, transaction?: sql.Transaction): Promise<boolean> {
    const request = await createRequest(transaction);
    const result = await request.input('id', sql.Int, id).query('DELETE FROM dbo.REVIEWS WHERE id = @id');

    return result.rowsAffected[0] > 0;
  }

  async refreshStallSummary(stallId: number, transaction?: sql.Transaction): Promise<void> {
    const request = await createRequest(transaction);
    const result = await request
      .input('stallId', sql.Int, stallId)
      .query<{ reviewCount: number; avgRating: number | string }>(`
        SELECT
          COUNT(*) AS reviewCount,
          ISNULL(AVG(CAST(rating AS DECIMAL(10, 4))), 0) AS avgRating
        FROM dbo.REVIEWS
        WHERE stall_id = @stallId
      `);

    const reviewCount = Number(result.recordset[0]?.reviewCount ?? 0);
    const avgRating = Number(result.recordset[0]?.avgRating ?? 0);

    const updateRequest = await createRequest(transaction);
    await updateRequest
      .input('stallId', sql.Int, stallId)
      .input('reviewCount', sql.Int, reviewCount)
      .input('avgRating', sql.Decimal(3, 2), avgRating)
      .query(`
        UPDATE dbo.STALLS
        SET avg_rating = @avgRating, review_count = @reviewCount
        WHERE id = @stallId
      `);
  }
}
