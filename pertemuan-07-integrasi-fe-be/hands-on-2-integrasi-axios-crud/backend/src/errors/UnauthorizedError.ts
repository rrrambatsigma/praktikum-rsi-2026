import { AppError } from './AppError.ts';

export class UnauthorizedError extends AppError {
  constructor(message = 'Sesi tidak valid atau sudah berakhir') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}
