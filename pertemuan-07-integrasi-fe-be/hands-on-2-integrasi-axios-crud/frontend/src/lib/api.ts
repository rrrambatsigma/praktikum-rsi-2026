import type {
  ApiResponse,
  AuditLog,
  CreateOwnerInput,
  Flag,
  FlagInput,
  FlagStatus,
  LikeState,
  LoginInput,
  MenuInput,
  MenuItem,
  MenuQuery,
  PasswordInput,
  ProfileInput,
  RegisterInput,
  Review,
  ReviewInput,
  Stall,
  StallInput,
  StallQuery,
  User,
  UserRole,
} from '../types/api.ts';
import { http } from './http.ts';

const data = <T>(response: { data: ApiResponse<T> }): T => response.data.data;

export const authApi = {
  register: (input: RegisterInput) =>
    http.post<ApiResponse<User>>('/auth/register', input).then(data),
  login: (input: LoginInput) =>
    http.post<ApiResponse<User>>('/auth/login', input).then(data),
  me: () => http.get<ApiResponse<User>>('/auth/me').then(data),
  logout: () => http.post('/auth/logout'),
};

export const profileApi = {
  get: () => http.get<ApiResponse<User>>('/profile').then(data),
  update: (input: ProfileInput) =>
    http.put<ApiResponse<User>>('/profile', input).then(data),
  changePassword: (input: PasswordInput) => http.patch('/profile/password', input),
};

export const usersApi = {
  list: (params?: { role?: UserRole; search?: string }) =>
    http.get<ApiResponse<User[]>>('/users', { params }).then(data),
  createOwner: (input: CreateOwnerInput) =>
    http.post<ApiResponse<User>>('/users/owner', input).then(data),
  updateRole: (id: number, role: UserRole) =>
    http.patch<ApiResponse<User>>(`/users/${id}/role`, { role }).then(data),
};

export const stallsApi = {
  list: (params?: StallQuery) =>
    http.get<ApiResponse<Stall[]>>('/stalls', { params }).then(data),
  get: (id: number) => http.get<ApiResponse<Stall>>(`/stalls/${id}`).then(data),
  create: (input: StallInput) =>
    http.post<ApiResponse<Stall>>('/stalls', input).then(data),
  update: (id: number, input: Partial<StallInput>) =>
    http.put<ApiResponse<Stall>>(`/stalls/${id}`, input).then(data),
  remove: (id: number) => http.delete(`/stalls/${id}`),
};

export const menuApi = {
  list: (params?: MenuQuery) =>
    http.get<ApiResponse<MenuItem[]>>('/menu', { params }).then(data),
  create: (input: MenuInput) =>
    http.post<ApiResponse<MenuItem>>('/menu', input).then(data),
  update: (id: number, input: MenuInput) =>
    http.put<ApiResponse<MenuItem>>(`/menu/${id}`, input).then(data),
  remove: (id: number) => http.delete(`/menu/${id}`),
};

export const reviewsApi = {
  byStall: (stallId: number) =>
    http.get<ApiResponse<Review[]>>(`/stalls/${stallId}/reviews`).then(data),
  mine: () => http.get<ApiResponse<Review[]>>('/reviews/mine').then(data),
  manage: () => http.get<ApiResponse<Review[]>>('/reviews/manage').then(data),
  create: (stallId: number, input: ReviewInput) =>
    http.post<ApiResponse<Review>>(`/stalls/${stallId}/reviews`, input).then(data),
  update: (id: number, input: ReviewInput) =>
    http.put<ApiResponse<Review>>(`/reviews/${id}`, input).then(data),
  remove: (id: number) => http.delete(`/reviews/${id}`),
  like: (id: number) =>
    http.post<ApiResponse<LikeState>>(`/reviews/${id}/like`).then(data),
  unlike: (id: number) =>
    http.delete<ApiResponse<LikeState>>(`/reviews/${id}/like`).then(data),
};

export const flagsApi = {
  create: (reviewId: number, input: FlagInput) =>
    http.post<ApiResponse<Flag>>(`/reviews/${reviewId}/flags`, input).then(data),
  list: (status?: FlagStatus) =>
    http.get<ApiResponse<Flag[]>>('/flags', { params: { status } }).then(data),
  updateStatus: (id: number, status: Exclude<FlagStatus, 'pending'>) =>
    http.patch<ApiResponse<Flag>>(`/flags/${id}`, { status }).then(data),
};

export const auditApi = {
  list: (params?: { action?: string; targetTable?: string }) =>
    http.get<ApiResponse<AuditLog[]>>('/audit-logs', { params }).then(data),
};
