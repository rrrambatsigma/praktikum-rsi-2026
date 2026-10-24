export type UserRole = 'admin' | 'owner' | 'customer';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}
