/**
 * Error dasar aplikasi yang membawa status code HTTP.
 * Subclass lain (NotFoundError, ValidationError) menurun dari sini.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}