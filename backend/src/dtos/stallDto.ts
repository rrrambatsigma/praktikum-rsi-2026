// Interface kontrak data response untuk client
export interface StallResponseDto {
  id: number;
  name: string;
  location: string;
  rating: number;
  isPopular: boolean; // Property tambahan dari kalkulasi logika bisnis
}