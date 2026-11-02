import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

/**
 * Setiap request mendapat id yang ikut dikirim ke client dan ditulis ke log.
 * Saat user melaporkan error, id ini yang dicari di log server.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.header('x-request-id')?.trim();
  const id = incoming && incoming.length <= 100 ? incoming : randomUUID();

  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};
