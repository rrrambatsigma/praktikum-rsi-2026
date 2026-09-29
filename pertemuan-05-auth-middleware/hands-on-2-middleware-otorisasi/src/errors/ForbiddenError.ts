import { AppError } from './AppError.ts';

/**
 * Dipakai saat user SUDAH berhasil terautentikasi (token valid) tetapi role-nya
 * tidak memenuhi syarat untuk endpoint tersebut. Memetakan ke HTTP 403.
 *
 * Bedakan dari 401 (UnauthorizedError):
 * - 401 = "siapa kamu?"  -> token hilang, salah tanda tangan, atau kedaluwarsa.
 * - 403 = "kamu tahu, tapi tidak boleh." -> token valid, role tidak cukup.
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Kamu tidak punya akses ke resource ini') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}