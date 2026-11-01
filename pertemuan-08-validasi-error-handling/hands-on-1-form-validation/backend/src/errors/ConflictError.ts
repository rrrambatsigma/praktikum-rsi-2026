import { AppError, type ErrorDetail } from './AppError.ts';

export class ConflictError extends AppError {
  constructor(
    code: string,
    message: string,
    details?: ErrorDetail[],
  ) {
    super(409, code, message, details);
    this.name = 'ConflictError';
  }
}
