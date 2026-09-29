/** Bentuk review yang dikirim ke client (tanpa kolom internal yang tidak perlu). */
export interface ReviewResponseDto {
  id: number;
  stallId: number;
  userId: number;
  rating: number;
  comment: string | null;
  likeCount: number;
  createdAt: string | null;
}