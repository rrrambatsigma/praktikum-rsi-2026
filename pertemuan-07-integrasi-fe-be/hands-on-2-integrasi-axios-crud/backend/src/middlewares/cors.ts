import type { RequestHandler } from 'express';
import { env } from '../config/env.ts';

export const corsMiddleware: RequestHandler = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', env.corsOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
};
