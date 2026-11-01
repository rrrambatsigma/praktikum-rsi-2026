import type {
  ApiErrorDetail,
  ApiFailure,
  ApiSuccess,
  CreateMenuResult,
  MenuItem,
  MenuPayload,
  Stall,
} from '../types/menu'
import type { LoginPayload, User } from '../types/auth'

const fallbackBaseUrl = 'http://localhost:3001/api'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.trim() || fallbackBaseUrl
).replace(/\/+$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: ApiErrorDetail[]

  constructor(
    status: number,
    code: string,
    message: string,
    details: ApiErrorDetail[] = [],
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
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

async function request<T>(path: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')

  if (init?.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    })
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Tidak dapat terhubung ke server. Pastikan backend berjalan di port 3001.',
    )
  }

  const rawBody = await response.text()
  let payload: unknown = null

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody)
    } catch {
      throw new ApiError(
        response.status,
        'INVALID_RESPONSE',
        'Respons server tidak dapat dibaca.',
      )
    }
  }

  if (!response.ok) {
    const failure = isObject(payload) ? (payload as unknown as ApiFailure) : null

    // Sesi kedaluwarsa saat memakai endpoint terlindungi: beri tahu AuthProvider.
    // Endpoint login dan pengecekan sesi dikecualikan karena 401 di sana wajar.
    if (
      response.status === 401 &&
      path !== '/auth/me' &&
      path !== '/auth/login'
    ) {
      window.dispatchEvent(new Event('auth:unauthorized'))
    }

    throw new ApiError(
      response.status,
      typeof failure?.code === 'string' ? failure.code : 'REQUEST_FAILED',
      typeof failure?.message === 'string'
        ? failure.message
        : 'Permintaan gagal diproses.',
      toDetails(failure?.errors),
    )
  }

  if (!isObject(payload) || payload.status !== 'success' || !('data' in payload)) {
    throw new ApiError(
      response.status,
      'INVALID_RESPONSE',
      'Format respons server tidak sesuai kesepakatan.',
    )
  }

  return payload as unknown as ApiSuccess<T>
}

export async function getMenus(): Promise<MenuItem[]> {
  const response = await request<MenuItem[]>('/menu')

  if (!Array.isArray(response.data)) {
    throw new ApiError(200, 'INVALID_RESPONSE', 'Daftar menu tidak valid.')
  }

  return response.data
}

export async function getStalls(): Promise<Stall[]> {
  const response = await request<Stall[]>('/stalls')

  if (!Array.isArray(response.data)) {
    throw new ApiError(200, 'INVALID_RESPONSE', 'Daftar warung tidak valid.')
  }

  return response.data
}

export async function createMenu(payload: MenuPayload): Promise<CreateMenuResult> {
  const response = await request<MenuItem>('/menu', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return {
    message: response.message ?? 'Menu berhasil ditambahkan.',
    data: response.data,
  }
}

export async function login(payload: LoginPayload): Promise<User> {
  const response = await request<User>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function getCurrentUser(): Promise<User> {
  const response = await request<User>('/auth/me')
  return response.data
}

export async function logout(): Promise<void> {
  await request<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' })
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function errorMessage(error: unknown): string {
  if (isApiError(error)) return error.message
  if (error instanceof Error && error.message) return error.message
  return 'Terjadi kesalahan yang tidak diketahui.'
}

export { API_BASE_URL }
