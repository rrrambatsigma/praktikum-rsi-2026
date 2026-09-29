import { and, avg, count, eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { reviews, stalls } from '../db/schema.ts';

export interface CreateReviewParams {
  stallId: number;
  userId: number;
  rating: number;
  comment: string | null;
}

export class ReviewRepository {
  /**
   * Satu user hanya boleh punya satu review per warung — dijaga unique
   * constraint di database, tapi dicek di sini juga supaya pesannya jelas
   * (409) alih-alih error constraint mentah dari driver.
   */
  async findByStallAndUser(stallId: number, userId: number) {
    const db = await getDb();
    const rows = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.stallId, stallId), eq(reviews.userId, userId)));
    return rows[0];
  }

  async create(params: CreateReviewParams) {
    const db = await getDb();
    const rows = await db
      .insert(reviews)
      .output()
      .values({
        stallId: params.stallId,
        userId: params.userId,
        rating: params.rating,
        comment: params.comment,
        likeCount: 0,
      });
    return rows[0];
  }

  /**
   * Hitung ulang ringkasan warung (avg_rating & review_count) dari tabel REVIEWS.
   *
   * Dua detail yang mudah terlewat di SQL Server:
   * 1. Dua langkah terpisah (SELECT agregat lalu UPDATE) jauh lebih mudah dibaca
   *    daripada menyisipkan AVG() langsung di dalam UPDATE, yang mudah salah begitu
   *    filter warung atau GROUP BY-nya lupa ditulis.
   * 2. `rating` bertipe INT, jadi AVG()-nya ikut dihitung sebagai bilangan bulat dan
   *    hasil 4.5 ikut terpotong jadi 4. Karena itu rating di-cast ke DECIMAL dulu
   *    sebelum dirata-ratakan.
   */
  async refreshStallSummary(stallId: number) {
    const db = await getDb();

    const stats = await db
      .select({
        total: count(),
        average: avg(sql<number>`cast(${reviews.rating} as decimal(10, 4))`),
      })
      .from(reviews)
      .where(eq(reviews.stallId, stallId));

    const total = Number(stats[0]?.total ?? 0);
    const average = Number(stats[0]?.average ?? 0);

    const updated = await db
      .update(stalls)
      .set({ reviewCount: total, avgRating: average.toFixed(2) })
      .where(eq(stalls.id, stallId))
      .output();

    return updated[0];
  }
}