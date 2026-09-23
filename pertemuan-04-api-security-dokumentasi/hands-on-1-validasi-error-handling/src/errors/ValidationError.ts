import { AppError } from './AppError.ts';

export interface ValidationIssue {
  field: string;
  message: string;
}

/** Diterapkan dari ZodError oleh middleware validate. Memetakan ke HTTP 400. */
export class ValidationError extends AppError {
  constructor(public readonly issues: ValidationIssue[]) {
    super(400, 'Validasi gagal', issues);
    this.name = 'ValidationError';
  }
}