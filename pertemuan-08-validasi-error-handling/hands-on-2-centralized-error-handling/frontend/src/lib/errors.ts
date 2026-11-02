import axios from 'axios'

export interface ApiErrorDetail {
  field: string
  message: string
}

interface ErrorEnvelope {
  code?: unknown
  message?: unknown
  errors?: unknown
  requestId?: unknown
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toDetails(value: unknown): ApiErrorDetail[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (
      isObject(item) &&
      typeof item.field === 'string' &&
      typeof item.message === 'string'
    ) {
      return [{ field: item.field, message: item.message }]
    }

    return []
  })
}

/**
 * Semua error Axios dinormalisasi ke satu bentuk. Komponen tidak perlu tahu
 * apakah error berasal dari response 4xx, timeout, atau koneksi putus.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    const response = error.response
    const data = isObject(response?.data) ? (response.data as ErrorEnvelope) : null
    const requestId =
      (typeof data?.requestId === 'string' ? data.requestId : undefined) ??
      (typeof response?.headers?.['x-request-id'] === 'string'
        ? response.headers['x-request-id']
        : undefined)

    if (!response) {
      const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'

      return new ApiError(
        0,
        timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
        timedOut
          ? 'Server terlalu lama merespons. Coba lagi.'
          : 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.',
        [],
        requestId,
      )
    }

    return new ApiError(
      response.status,
      typeof data?.code === 'string' ? data.code : 'REQUEST_FAILED',
      typeof data?.message === 'string'
        ? data.message
        : 'Permintaan gagal diproses.',
      toDetails(data?.errors),
      requestId,
    )
  }

  if (error instanceof Error && error.message) {
    return new ApiError(0, 'UNKNOWN_ERROR', error.message)
  }

  return new ApiError(0, 'UNKNOWN_ERROR', 'Terjadi kesalahan yang tidak diketahui.')
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function errorMessage(error: unknown): string {
  return toApiError(error).message
}

export function getFieldErrors(error: unknown): Record<string, string> {
  const apiError = toApiError(error)
  const result: Record<string, string> = {}

  for (const detail of apiError.details) {
    if (result[detail.field] === undefined) {
      result[detail.field] = detail.message
    }
  }

  return result
}
