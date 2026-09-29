import type { AuthUser } from '../services/tokenService.ts';

/**
 * Augmentasi tipe Express secara global.
 *
 * Menambah properti `user` ke `Express.Request` berarti SETIAP handler,
 * service, dan middleware di proyek ini bisa menulis `req.user` tanpa
 * casting dan tanpa membuat interface `AuthRequest` sendiri di tiap modul.
 *
 * `user` sengaja opsional (`?`): pada route publik `authenticate` tidak
 * dijalankan, jadi nilainya memang belum ada. Pembacaannya selalu lewat
 * `getUser()` yang melempar 401 kalau belum diisi.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};