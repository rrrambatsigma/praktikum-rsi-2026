import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { verifyToken, type AuthUser } from '../services/tokenService.ts';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';

const BEARER_PREFIX = 'Bearer ';

/**
 * Ambil token dari header `Authorization: Bearer <token>`.
 * Mengembalikan null kalau header tidak ada, tidak memakai skema Bearer, atau
 * tokennya kosong — semua kondisi itu sama-sama berarti "tidak terautentikasi".
 */
function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith(BEARER_PREFIX)) return null;

  const token = header.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

/**
 * Middleware autentikasi.
 *
 * Tanggung jawabnya satu saja: memastikan request membawa token yang valid,
 * lalu menaruhnya di `req.user` supaya handler berikutnya tidak perlu mengurai
 * token lagi. Kegagalan diteruskan lewat `next(error)` supaya semua error
 * dibalas oleh satu `errorHandler` yang sama seperti di Pertemuan-04.
 */
export const authenticate: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = extractToken(req);
  if (!token) {
    return next(new UnauthorizedError('Header Authorization dengan token Bearer wajib dikirim'));
  }

  try {
    // verifyToken melempar kalau signature salah atau token kedaluwarsa.
    req.user = verifyToken(token);
    return next();
  } catch {
    // Detail sengaja ditelan: client tidak perlu tahu bedanya "expired" dengan
    // "signature salah" — cukup tahu tokennya tidak valid.
    return next(new UnauthorizedError());
  }
};

/**
 * Pembaca `req.user` yang aman untuk controller dan middleware lain.
 * Melempar 401 (bukan diam-diam `undefined`) supaya kesalahan "lupa pasang
 * authenticate" muncul jelas saat pengembangan, bukan jadi error aneh
 * di baris kode lain yang tidak ada hubungannya.
 */
export function getUser(req: Request): AuthUser {
  if (!req.user) {
    throw new UnauthorizedError('Endpoint ini harus dipakai setelah middleware authenticate');
  }
  return req.user;
}