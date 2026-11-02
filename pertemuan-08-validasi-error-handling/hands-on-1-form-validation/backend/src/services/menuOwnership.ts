import type { AuthUser } from '../types/user.ts';

/**
 * Object-level authorization: role saja tidak cukup.
 * Owner hanya boleh mengelola warung miliknya; admin boleh semua.
 */
export function canManageStall(stallOwnerId: number, user: AuthUser): boolean {
  return user.role === 'admin' || stallOwnerId === user.id;
}
