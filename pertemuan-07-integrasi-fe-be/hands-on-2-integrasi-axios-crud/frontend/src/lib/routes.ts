import type { UserRole } from '../types/api.ts';

export function homeForRole(role: UserRole): string {
  if (role === 'admin') return '/admin';
  if (role === 'owner') return '/owner';
  return '/';
}
