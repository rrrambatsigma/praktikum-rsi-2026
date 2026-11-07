import type { UserRole } from '../types/user.ts';

/**
 * Bentuk user yang aman dikirim ke browser.
 * `passwordHash` sengaja tidak pernah ikut di DTO ini.
 */
export interface AuthUserDto {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}
