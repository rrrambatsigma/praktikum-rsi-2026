import type { Request, Response } from 'express';

/** Menangkap rute yang tidak dikenal dan membalas 404 JSON. */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    status: 'fail',
    message: `Route tidak ditemukan: ${req.method} ${req.originalUrl}`,
  });
}