import type { AxiosResponse } from 'axios'
import type { AuditLogFilters, AuditLogList } from '../types/auditLog'
import type { LoginPayload, RegisterPayload, User } from '../types/auth'
import type {
  AdminOrder,
  CreateOrderPayload,
  Order,
  OrderStatus,
  OwnerOrder,
} from '../types/order'
import type { MenuItem, MenuPayload, Stall } from '../types/menu'
import { ApiError } from './errors'
import { http } from './http'

export { API_BASE_URL } from './http'
export {
  ApiError,
  errorMessage,
  getFieldErrors,
  isApiError,
} from './errors'

interface SuccessEnvelope<T> {
  status: 'success'
  message?: string
  data: T
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function unwrap<T>(response: AxiosResponse<unknown>): SuccessEnvelope<T> {
  const payload = response.data

  if (
    !isObject(payload) ||
    payload.status !== 'success' ||
    !('data' in payload)
  ) {
    throw new ApiError(
      response.status,
      'INVALID_RESPONSE',
      'Format respons server tidak sesuai kesepakatan.',
    )
  }

  return payload as unknown as SuccessEnvelope<T>
}

async function getData<T>(request: Promise<AxiosResponse<unknown>>): Promise<T> {
  return unwrap<T>(await request).data
}

async function getResult<T>(
  request: Promise<AxiosResponse<unknown>>,
  fallbackMessage: string,
): Promise<{ message: string; data: T }> {
  const envelope = unwrap<T>(await request)
  return {
    message: envelope.message ?? fallbackMessage,
    data: envelope.data,
  }
}

export async function getMenus(): Promise<MenuItem[]> {
  const data = await getData<MenuItem[]>(http.get('/menu'))

  if (!Array.isArray(data)) {
    throw new ApiError(200, 'INVALID_RESPONSE', 'Daftar menu tidak valid.')
  }

  return data
}

export async function getStalls(): Promise<Stall[]> {
  const data = await getData<Stall[]>(http.get('/stalls'))

  if (!Array.isArray(data)) {
    throw new ApiError(200, 'INVALID_RESPONSE', 'Daftar warung tidak valid.')
  }

  return data
}

/** Hanya warung yang boleh dikelola user yang sedang login. */
export async function getMyStalls(): Promise<Stall[]> {
  const data = await getData<Stall[]>(http.get('/stalls/mine'))

  if (!Array.isArray(data)) {
    throw new ApiError(200, 'INVALID_RESPONSE', 'Daftar warung tidak valid.')
  }

  return data
}

export function createMenu(
  payload: MenuPayload,
): Promise<{ message: string; data: MenuItem }> {
  return getResult<MenuItem>(
    http.post('/menu', payload),
    'Menu berhasil ditambahkan.',
  )
}

export function updateMenu(
  id: number,
  payload: MenuPayload,
): Promise<{ message: string; data: MenuItem }> {
  return getResult<MenuItem>(
    http.put(`/menu/${id}`, payload),
    'Menu berhasil diperbarui.',
  )
}

export async function deleteMenu(id: number): Promise<void> {
  await http.delete(`/menu/${id}`)
}

export function register(
  payload: RegisterPayload,
): Promise<{ message: string; data: User }> {
  return getResult<User>(
    http.post('/auth/register', payload),
    'Akun berhasil dibuat. Silakan masuk.',
  )
}

export async function login(payload: LoginPayload): Promise<User> {
  return getData<User>(http.post('/auth/login', payload))
}

export async function getCurrentUser(): Promise<User> {
  return getData<User>(http.get('/auth/me'))
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout')
}

export function createOrder(
  payload: CreateOrderPayload,
): Promise<{ message: string; data: Order }> {
  return getResult<Order>(
    http.post('/orders', payload),
    'Pesanan berhasil dibuat.',
  )
}

export async function getAllOrders(): Promise<AdminOrder[]> {
  const data = await getData<AdminOrder[]>(http.get('/orders'))

  if (!Array.isArray(data)) {
    throw new ApiError(200, 'INVALID_RESPONSE', 'Daftar pesanan tidak valid.')
  }

  return data
}

export async function getOrderDetail(id: number): Promise<Order> {
  return getData<Order>(http.get(`/orders/${id}`))
}

export async function getMyOrders(): Promise<OwnerOrder[]> {
  const data = await getData<OwnerOrder[]>(http.get('/orders/mine'))

  if (!Array.isArray(data)) {
    throw new ApiError(200, 'INVALID_RESPONSE', 'Daftar tiket pesanan tidak valid.')
  }

  return data
}

export function updateOrderStatus(
  id: number,
  status: Exclude<OrderStatus, 'confirmed'>,
): Promise<{ message: string; data: Order }> {
  return getResult<Order>(
    http.patch(`/orders/${id}/status`, { status }),
    'Status pesanan berhasil diperbarui.',
  )
}

export async function getAuditLogs(
  filters: AuditLogFilters = {},
): Promise<AuditLogList> {
  const data = await getData<AuditLogList>(
    http.get('/audit-logs', { params: filters }),
  )

  if (
    typeof data !== 'object' ||
    data === null ||
    !Array.isArray(data.items) ||
    typeof data.pagination !== 'object' ||
    data.pagination === null
  ) {
    throw new ApiError(200, 'INVALID_RESPONSE', 'Riwayat audit tidak valid.')
  }

  return data
}
