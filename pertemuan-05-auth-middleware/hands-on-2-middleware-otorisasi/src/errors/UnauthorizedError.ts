import { AppError } from './AppError.ts';

/**
 * Dipakai saat request tidak membawa token yang bisa dipercaya — belum login,
 * token tidak ada, format header salah, signature tidak cocok, atau token kedaluwarsa.
 * Memetakan ke HTTP 401.
 *
 * Bedakan dengan 403 (ForbiddenError, ada di hands-on 2): 401 berarti "siapa kamu?"
 * belum terjawab, 403 berarti "kamu tahu, tapi tidak boleh".
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Token tidak ada atau tidak valid') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}