export interface StallDto {
  id: number;
  ownerId: number;
  ownerName: string;
  name: string;
  category: string | null;
  location: string | null;
  description: string | null;
  avgRating: number;
  reviewCount: number;
  isPopular: boolean;
  createdAt: string | null;
}
