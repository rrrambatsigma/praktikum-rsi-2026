import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.ts';
import { ValidationError } from '../errors/ValidationError.ts';

function requestIdOf(req: { requestId?: string }): string | undefined {
  return req.requestId;
}

function sendError(
  res: Parameters<ErrorRequestHandler>[2],
  req: Parameters<ErrorRequestHandler>[0],
  status: number,
  code: string,
  message: string,
  details?: Array<{ field: string; message: string }>,
): void {
  res.status(status).json({
    status: status >= 500 ? 'error' : 'fail',
    code,
    message,
    ...(details !== undefined ? { errors: details } : {}),
    requestId: requestIdOf(req),
  });
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const bodyError = error as SyntaxError & { status?: number; type?: string };

  if (
    error instanceof SyntaxError &&
    bodyError.status === 400 &&
    bodyError.type === 'entity.parse.failed'
  ) {
    sendError(res, req, 400, 'INVALID_JSON', 'JSON pada body tidak valid.');
    return;
  }

  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.length > 0 ? String(issue.path[0]) : 'body',
      message: issue.message,
    }));

    sendError(res, req, 400, 'VALIDATION_ERROR', 'Data yang dikirim tidak valid.', details);
    return;
  }

  if (error instanceof ValidationError) {
    sendError(res, req, error.statusCode, error.code, error.message, error.details);
    return;
  }

  if (error instanceof AppError) {
    sendError(res, req, error.statusCode, error.code, error.message, error.details);
    return;
  }

  const dbError = error as { number?: number };

  if (dbError.number === 2627 || dbError.number === 2601) {
    sendError(
      res,
      req,
      409,
      'CONFLICT',
      'Data bentrok dengan data yang sudah ada.',
    );
    return;
  }

  if (dbError.number === 547) {
    sendError(
      res,
      req,
      409,
      'CONFLICT',
      'Data masih berhubungan dengan data lain.',
    );
    return;
  }

  const requestId = requestIdOf(req);
  console.error(`[${requestId ?? 'no-request-id'}] Unhandled error:`, error);
  sendError(res, req, 500, 'INTERNAL_ERROR', 'Terjadi kesalahan pada server.');
};
