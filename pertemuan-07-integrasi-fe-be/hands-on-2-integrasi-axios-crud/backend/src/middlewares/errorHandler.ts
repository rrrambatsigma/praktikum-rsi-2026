import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError.ts';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const bodyError = error as SyntaxError & { status?: number; type?: string };

  if (
    error instanceof SyntaxError &&
    bodyError.status === 400 &&
    bodyError.type === 'entity.parse.failed'
  ) {
    res.status(400).json({
      status: 'fail',
      message: 'JSON pada body tidak valid',
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      status: 'fail',
      message: error.message,
      ...(error.details !== undefined ? { errors: error.details } : {}),
    });
    return;
  }

  const dbError = error as { number?: number };

  if (dbError.number === 2627 || dbError.number === 2601 || dbError.number === 547) {
    res.status(409).json({
      status: 'fail',
      message: 'Data bentrok dengan data yang sudah ada',
    });
    return;
  }

  console.error('Unhandled error:', error);
  res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan pada server',
  });
};
