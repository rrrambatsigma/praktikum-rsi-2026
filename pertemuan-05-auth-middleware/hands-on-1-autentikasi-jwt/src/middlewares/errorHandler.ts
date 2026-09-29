import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { ValidationError } from '../errors/ValidationError.ts';

/**
 * Error handling terpusat: satu tempat untuk mengubah error menjadi
 * respons JSON yang konsisten. Didaftarkan paling akhir (setelah router).
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  // 1) Body JSON yang rusak (express.json otomatis melempar SyntaxError).
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

  // 2) Error aplikasi yang disengaja (NotFoundException, ValidationError, dll).
  if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AppError) {
    res.status(error.statusCode).json({
      status: 'fail',
      message: error.message,
      ...(error.details !== undefined ? { errors: error.details } : {}),
    });
    return;
  }

  // 3) Konflik constraint database mssql:
  //    2627 = unique violation, 547 = foreign key violation.
  const dbError = error as { number?: number };
  if (dbError.number === 2627 || dbError.number === 547) {
    res.status(409).json({
      status: 'fail',
      message: 'Data bentrok dengan data yang sudah ada',
    });
    return;
  }

  // 4) Fallback: error tak terduga. Detail tidak dibocorkan ke client.
  console.error('Unhandled error:', error);
  res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan pada server',
  });
};