export interface ApiErrorDetail {
  field: string
  message: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: ApiErrorDetail[]
  readonly requestId?: string

  constructor(
    status: number,
    code: string,
    message: string,
    details: ApiErrorDetail[] = [],
    requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
  }
}

export function toApiError(_error: unknown): ApiError {
  // TODO: normalisasi error Axios ke satu bentuk ApiError.
  // - Response 4xx/5xx: ambil code, message, errors[], dan requestId.
  // - Timeout (ECONNABORTED/ETIMEDOUT): status 0, code TIMEOUT.
  // - Tanpa response: status 0, code NETWORK_ERROR.
  // - Error lain: status 0, code UNKNOWN_ERROR.
  void _error
  return new ApiError(0, 'UNKNOWN_ERROR', 'Terjadi kesalahan. Coba lagi.')
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function errorMessage(error: unknown): string {
  return toApiError(error).message
}

export function getFieldErrors(_error: unknown): Record<string, string> {
  // TODO: ubah ApiError.details menjadi map field -> message.
  void _error
  return {}
}
