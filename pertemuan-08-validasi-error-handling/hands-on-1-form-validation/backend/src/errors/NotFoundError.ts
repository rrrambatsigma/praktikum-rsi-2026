import { AppError, type ErrorDetail } from './AppError.ts';

export class NotFoundError extends AppError {
  constructor(
    code: string,
    message: string,
    details?: ErrorDetail[],
  ) {
    super(404, code, message, details);
    this.name = 'NotFoundError';
  }
}
