import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError, type ValidationIssue } from '../errors/ValidationError.ts';

export type RequestSource = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, source: RequestSource): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      return next(new ValidationError(issues));
    }

    const validated = (res.locals.validated ?? {}) as Record<RequestSource, unknown>;
    validated[source] = result.data;
    res.locals.validated = validated;
    return next();
  };
}

export function getValidated<T>(res: Response, source: RequestSource): T {
  const validated = (res.locals.validated ?? {}) as Record<RequestSource, unknown>;
  return validated[source] as T;
}
