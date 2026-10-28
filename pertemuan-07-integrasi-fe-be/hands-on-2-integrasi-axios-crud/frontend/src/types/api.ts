export type UserRole = 'admin' | 'owner' | 'customer';
export type FlagStatus = 'pending' | 'resolved' | 'dismissed';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string | null;
}

export interface Stall {
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

export interface MenuItem {
  id: number;
  stallId: number;
  stallName: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface Review {
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

export interface LikeState {
  reviewId: number;
  liked: boolean;
  likeCount: number;
}

export interface Flag {
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

export interface AuditLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  targetTable: string;
  targetId: number;
  metadata: string | null;
  createdAt: string | null;
}

export interface ApiResponse<T> {
  status: 'success';
  data: T;
}

export interface ApiErrorBody {
  status: 'fail' | 'error';
  message: string;
  errors?: { field: string; message: string }[];
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ProfileInput {
  name?: string;
  email?: string;
}

export interface PasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface StallQuery {
  search?: string;
  category?: string;
}

export interface StallInput {
  ownerId: number;
  name: string;
  category?: string | null;
  location?: string | null;
  description?: string | null;
}

export interface MenuQuery {
  stallId?: number;
  search?: string;
  available?: boolean;
}

export interface MenuInput {
  stallId: number;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface ReviewInput {
  rating: number;
  comment?: string | null;
}

export interface FlagInput {
  reason?: string | null;
}

export interface CreateOwnerInput {
  name: string;
  email: string;
  password: string;
}
