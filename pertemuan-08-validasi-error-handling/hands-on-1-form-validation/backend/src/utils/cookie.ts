import type { Response } from 'express';
import { env } from '../config/env.ts';
import { getTokenMaxAge } from '../services/tokenService.ts';

const secure = env.nodeEnv === 'production';

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(env.authCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: getTokenMaxAge(token),
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(env.authCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
  });
}
