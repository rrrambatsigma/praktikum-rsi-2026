import type { RequestHandler } from 'express';
import type { ZodError, ZodTypeAny } from 'zod';
import type { ErrorDetail } from '../errors/AppError.ts';
import { ValidationError } from '../errors/ValidationError.ts';

function toDetails(error: ZodError): ErrorDetail[] {
  return error.issues.map((issue) => {
    if (issue.code === 'unrecognized_keys') {
      return {
        field: 'body',
        message: `Field tidak dikenal: ${(issue.keys ?? []).join(', ')}.`,
      };
    }

    return {
      field: issue.path.length > 0 ? String(issue.path[0]) : 'body',
      message: issue.message,
    };
  });
}

/**
 * Satu tempat untuk mengubah ZodError menjadi kontrak error aplikasi.
 * Controller tidak perlu menulis try/catch validasi sendiri.
 */
export function validateBody(schema: ZodTypeAny, message?: string): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(new ValidationError(toDetails(result.error), message));
    }

    req.body = result.data;
    return next();
  };
}
