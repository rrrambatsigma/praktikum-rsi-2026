import jwt, { type SignOptions } from 'jsonwebtoken';
import type { UserRole } from '../repositories/userRepository.ts';

/** Bentuk `req.user` nanti diisi oleh middleware auth (hands-on 2). */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

/**
 * Rahasia penanda tangani JWT dibaca dari .env.
 * Sengaja TIDAK diberi nilai default: kalau lupa diset, server harus berhenti
 * dengan pesan jelas, bukan diam-diam menandatangani token dengan string tebakan.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET belum diset di .env — token tidak bisa dibuat atau diverifikasi');
  }
  return secret;
}

/**
 * Umur token (format '2h', '30m', '7d'). Tipe yang diharapkan jsonwebtoken
 * adalah tipe internal miliknya sendiri, jadi string dari env di-cast lewat
 * SignOptions agar strict TypeScript tidak protes.
 */
function getExpiresIn(): SignOptions['expiresIn'] {
  return (process.env.JWT_EXPIRES_IN ?? '2h') as SignOptions['expiresIn'];
}

/**
 * Membuat token JWT. Isinya (payload):
 * - sub / id : identitas user
 * - name, email, role : data yang dibutuhkan server untuk otorisasi nanti
 * - iat, exp : dibuat kapan & kedaluwarsa kapan (otomatis oleh jsonwebtoken)
 *
 * JANGAN pernah menaruh password di payload — payload hanya di-encode
 * (base64url), bukan dienkripsi, sehingga bisa dibaca siapa pun yang punya token.
 */
export function signToken(user: AuthUser): string {
  return jwt.sign(
    { sub: String(user.id), name: user.name, email: user.email, role: user.role },
    getJwtSecret(),
    {
      algorithm: 'HS256',
      expiresIn: getExpiresIn(),
    },
  );
}

/**
 * Membalik proses `signToken`: memastikan signature cocok dengan JWT_SECRET
 * dan token belum kedaluwarsa, lalu mengembalikan AuthUser.
 *
 * Melempar TokenExpiredError / JsonWebTokenError kalau tidak valid —
 * pemanggil yang memutuskan cara membalas ke client (middleware auth → 401).
 */
export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });

  if (typeof payload === 'string') {
    throw new jwt.JsonWebTokenError('Payload token bukan objek JSON');
  }

  const id = Number(payload.sub);
  const { name, email, role } = payload as {
    name?: string;
    email?: string;
    role?: UserRole;
  };

  if (!Number.isInteger(id) || !name || !email || !role) {
    throw new jwt.JsonWebTokenError('Payload token tidak memuat data user yang lengkap');
  }

  return { id, name, email, role };
}