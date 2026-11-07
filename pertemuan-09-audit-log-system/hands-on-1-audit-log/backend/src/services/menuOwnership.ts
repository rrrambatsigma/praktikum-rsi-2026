import type { AuthUser } from '../types/user.ts';

/**
 * Object-level authorization: role saja tidak cukup.
 * Hanya owner yang boleh mengelola warung miliknya sendiri.
 * Admin tidak otomatis mendapat izin tulis menu (least privilege).
 */
export function canManageStall(stallOwnerId: number, user: AuthUser): boolean {
  return user.role === 'owner' && stallOwnerId === user.id;
}
