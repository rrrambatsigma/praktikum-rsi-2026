import { AppError } from './AppError.ts';

/** Dipakai saat resource (mis. warung) tidak ditemukan. Memetakan ke HTTP 404. */
export class NotFoundError extends AppError {
  constructor(message = 'Data tidak ditemukan') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}