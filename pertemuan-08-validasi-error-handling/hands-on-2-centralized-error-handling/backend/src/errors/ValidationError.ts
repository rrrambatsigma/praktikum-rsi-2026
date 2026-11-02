import { AppError, type ErrorDetail } from './AppError.ts';

export class ValidationError extends AppError {
  constructor(details: ErrorDetail[], message = 'Data menu tidak valid.') {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}
