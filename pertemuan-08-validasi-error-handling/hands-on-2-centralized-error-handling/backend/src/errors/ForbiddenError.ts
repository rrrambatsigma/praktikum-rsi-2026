import { AppError } from './AppError.ts';

export class ForbiddenError extends AppError {
  constructor(message = 'Anda tidak memiliki akses ke operasi ini.') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}
