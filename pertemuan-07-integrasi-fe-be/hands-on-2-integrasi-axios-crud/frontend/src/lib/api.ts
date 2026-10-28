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
  register: (_input: RegisterInput): Promise<User> => {
    void _input;
    return Promise.reject(new Error('authApi.register belum diimplementasikan'));
  },
  login: (_input: LoginInput): Promise<User> => {
    void _input;
    return Promise.reject(new Error('authApi.login belum diimplementasikan'));
  },
  me: (): Promise<User> =>
    Promise.reject(new Error('authApi.me belum diimplementasikan')),
  logout: (): Promise<void> =>
    Promise.reject(new Error('authApi.logout belum diimplementasikan')),
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
  list: (_params?: MenuQuery): Promise<MenuItem[]> => {
    void _params;
    return Promise.reject(new Error('menuApi.list belum diimplementasikan'));
  },
  create: (_input: MenuInput): Promise<MenuItem> => {
    void _input;
    return Promise.reject(new Error('menuApi.create belum diimplementasikan'));
  },
  update: (_id: number, _input: MenuInput): Promise<MenuItem> => {
    void _id;
    void _input;
    return Promise.reject(new Error('menuApi.update belum diimplementasikan'));
  },
  remove: (_id: number): Promise<void> => {
    void _id;
    return Promise.reject(new Error('menuApi.remove belum diimplementasikan'));
  },
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
