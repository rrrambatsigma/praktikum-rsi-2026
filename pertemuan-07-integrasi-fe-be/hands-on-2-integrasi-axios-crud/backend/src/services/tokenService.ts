import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.ts';
import type { AuthUser, UserRole } from '../types/user.ts';

const roles: UserRole[] = ['admin', 'owner', 'customer'];

function getExpiresIn(): SignOptions['expiresIn'] {
  return env.jwtExpiresIn as SignOptions['expiresIn'];
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      sub: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    {
      algorithm: 'HS256',
      expiresIn: getExpiresIn(),
    },
  );
}

export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });

  if (typeof payload === 'string') {
    throw new jwt.JsonWebTokenError('Payload token bukan objek JSON');
  }

  const id = Number(payload.sub);
  const name = payload.name;
  const email = payload.email;
  const role = payload.role;

  if (
    !Number.isInteger(id) ||
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof role !== 'string' ||
    !roles.includes(role as UserRole)
  ) {
    throw new jwt.JsonWebTokenError('Payload token tidak lengkap');
  }

  return { id, name, email, role: role as UserRole };
}

export function getTokenMaxAge(token: string): number {
  const payload = jwt.decode(token);

  if (!payload || typeof payload === 'string' || typeof payload.exp !== 'number') {
    throw new jwt.JsonWebTokenError('Token tidak memiliki waktu kedaluwarsa');
  }

  return Math.max(0, payload.exp * 1000 - Date.now());
}
