import { avg, count, sql } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { reviews, stalls, users } from '../db/schema.ts';
import type { ReportSummaryDto } from '../dtos/reportDto.ts';

/**
 * Query agregat untuk laporan admin.
 *
 * Router dan service yang memanggil method ini sudah dijaga `authorize('admin')`
 * oleh middleware — cara paling aman tetap dengan membatasi di lapisan route,
 * bukan sekadar bertanya "siapa saja yang boleh memanggil file ini?".
 */
export class ReportService {
  async getSummary(): Promise<ReportSummaryDto> {
    const db = await getDb();

    // Empat agregat yang tidak saling bergantung, jadi dikirim bersamaan.
    // Cast ke DECIMAL dulu, sama alasannya seperti di ReviewRepository.
    const [userRows, stallRows, reviewRows, averageRows] = await Promise.all([
      db.select({ total: count() }).from(users),
      db.select({ total: count() }).from(stalls),
      db.select({ total: count() }).from(reviews),
      db
        .select({ average: avg(sql<number>`cast(${reviews.rating} as decimal(10, 4))`) })
        .from(reviews),
    ]);

    // Pengelompokan per kategori sekaligus menghitung jumlahnya.
    const byCategory = await db
      .select({ category: stalls.category, total: count() })
      .from(stalls)
      .groupBy(stalls.category)
      .orderBy(stalls.category);

    return {
      totalUsers: Number(userRows[0]?.total ?? 0),
      totalStalls: Number(stallRows[0]?.total ?? 0),
      totalReviews: Number(reviewRows[0]?.total ?? 0),
      averageRating: Number(averageRows[0]?.average ?? 0),
      stallsByCategory: byCategory.map((row) => ({
        category: row.category,
        total: Number(row.total),
      })),
    };
  }
}