import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import { getUser } from './auth.ts';
import type { UserRole } from '../repositories/userRepository.ts';

/**
 * Middleware otorisasi BERPARAMETER.
 *
 * `authorize(...roles)` mengembalikan RequestHandler baru, jadi pola yang
 * dipakai di router nanti cukup menulis role-nya di dalam kurung:
 *
 *   authenticate, authorize('admin')            -> hanya admin
 *   authenticate, authorize('owner', 'admin')   -> owner atau admin
 *
 * Wajib dipasang SETELAH `authenticate`, karena `req.user` baru ada setelah
 * token diverifikasi. Memasangnya terbalik akan menghasilkan 401, bukan 403.
 */
export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Menangkap kesalahan saat development: middleware dijalankan tanpa
    // satu pun role, artinya rute ini tidak pernah bisa diakses.
    if (allowedRoles.length === 0) {
      return next(new Error('authorize() harus menerima minimal satu role'));
    }

    // getUser melempar UnauthorizedError (401) kalau req.user belum diisi —
    // inilah penjaga kalau urutan middleware terbalik.
    const user = getUser(req);

    if (!allowedRoles.includes(user.role)) {
      return next(
        new ForbiddenError(`Endpoint ini hanya untuk role: ${allowedRoles.join(', ')}`),
      );
    }

    return next();
  };
}