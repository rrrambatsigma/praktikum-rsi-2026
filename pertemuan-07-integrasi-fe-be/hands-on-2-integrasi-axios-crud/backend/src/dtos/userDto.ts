import type { UserRole } from '../types/user.ts';

export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string | null;
}
