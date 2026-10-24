export interface ReviewDto {
  id: number;
  stallId: number;
  stallName: string;
  userId: number;
  userName: string;
  rating: number;
  comment: string | null;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}
