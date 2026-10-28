import type { RequestHandler } from 'express';
import { NotFoundError } from '../errors/NotFoundError.ts';

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new NotFoundError('Endpoint tidak ditemukan'));
};
