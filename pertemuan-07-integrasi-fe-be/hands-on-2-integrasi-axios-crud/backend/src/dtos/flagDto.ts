export type FlagStatus = 'pending' | 'resolved' | 'dismissed';

export interface FlagDto {
  id: number;
  reviewId: number;
  reportedBy: number;
  reporterName: string;
  reviewComment: string | null;
  stallId: number;
  stallName: string;
  reason: string | null;
  status: FlagStatus;
  createdAt: string | null;
}
