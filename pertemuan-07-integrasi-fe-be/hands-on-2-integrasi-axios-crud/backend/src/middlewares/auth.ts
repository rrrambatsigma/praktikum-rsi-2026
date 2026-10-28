import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { env } from '../config/env.ts';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';
import { UserRepository } from '../repositories/userRepository.ts';
import { verifyToken } from '../services/tokenService.ts';
import type { AuthUser } from '../types/user.ts';

const userRepository = new UserRepository();
const jwtErrorNames = new Set(['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError']);

function isJwtError(error: unknown): boolean {
  return error instanceof Error && jwtErrorNames.has(error.name);
}

function extractToken(req: Request): string | null {
  const token = req.cookies?.[env.authCookieName];

  if (typeof token !== 'string') return null;

  const trimmed = token.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function loadCurrentUser(token: string): Promise<AuthUser | null> {
  const payload = verifyToken(token);
  const row = await userRepository.findById(payload.id);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  };
}

export const authenticate: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = extractToken(req);

  if (!token) {
    return next(new UnauthorizedError('Silakan login terlebih dahulu'));
  }

  try {
    const user = await loadCurrentUser(token);

    if (!user) {
      return next(new UnauthorizedError());
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }

    if (isJwtError(error)) {
      return next(new UnauthorizedError('Sesi login tidak valid atau sudah kedaluwarsa'));
    }

    return next(error);
  }
};

export const optionalAuthenticate: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = extractToken(req);

  if (!token) return next();

  try {
    const user = await loadCurrentUser(token);
    if (user) req.user = user;
    return next();
  } catch (error) {
    if (isJwtError(error)) {
      return next();
    }

    if (error instanceof UnauthorizedError) {
      return next();
    }

    return next(error);
  }
};

export function getUser(req: Request): AuthUser {
  if (!req.user) {
    throw new UnauthorizedError('Endpoint ini membutuhkan sesi login');
  }

  return req.user;
}
