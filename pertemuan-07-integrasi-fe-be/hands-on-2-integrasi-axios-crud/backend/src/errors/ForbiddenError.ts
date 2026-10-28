import { AppError } from './AppError.ts';

export class ForbiddenError extends AppError {
  constructor(message = 'Kamu tidak berhak mengakses resource ini') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}
