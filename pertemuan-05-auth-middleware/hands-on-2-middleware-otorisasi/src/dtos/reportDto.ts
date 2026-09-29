/** Angka-angka ringkas untuk halaman laporan admin. */
export interface ReportSummaryDto {
  totalUsers: number;
  totalStalls: number;
  totalReviews: number;
  averageRating: number;
  stallsByCategory: Array<{ category: string | null; total: number }>;
}