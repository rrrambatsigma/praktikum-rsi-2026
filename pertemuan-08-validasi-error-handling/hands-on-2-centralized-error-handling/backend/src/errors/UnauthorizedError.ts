import { AppError } from './AppError.ts';

export class UnauthorizedError extends AppError {
  constructor(message = 'Silakan login terlebih dahulu.') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}
