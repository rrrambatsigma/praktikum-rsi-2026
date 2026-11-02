import type { AxiosResponse } from 'axios'
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

export async function getResult<T>(
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
  _payload: MenuPayload,
): Promise<{ message: string; data: MenuItem }> {
  // TODO: kirim POST /menu dengan body payload lalu bungkus hasilnya memakai getResult.
  void _payload
  return Promise.reject(new Error('createMenu belum diimplementasikan'))
}

export function updateMenu(
  _id: number,
  _payload: MenuPayload,
): Promise<{ message: string; data: MenuItem }> {
  // TODO: kirim PUT /menu/:id dengan body payload.
  void _id
  void _payload
  return Promise.reject(new Error('updateMenu belum diimplementasikan'))
}

export async function deleteMenu(_id: number): Promise<void> {
  // TODO: kirim DELETE /menu/:id.
  void _id
  return Promise.reject(new Error('deleteMenu belum diimplementasikan'))
}

export function register(
  _payload: RegisterPayload,
): Promise<{ message: string; data: User }> {
  // TODO: kirim POST /auth/register tanpa mengirim role dari client.
  void _payload
  return Promise.reject(new Error('register belum diimplementasikan'))
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
  _payload: CreateOrderPayload,
): Promise<{ message: string; data: Order }> {
  // TODO: kirim POST /orders. Total dihitung server, jangan kirim total dari client.
  void _payload
  return Promise.reject(new Error('createOrder belum diimplementasikan'))
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
  _id: number,
  _status: Exclude<OrderStatus, 'confirmed'>,
): Promise<{ message: string; data: Order }> {
  // TODO: kirim PATCH /orders/:id/status dengan body { status }.
  void _id
  void _status
  return Promise.reject(new Error('updateOrderStatus belum diimplementasikan'))
}
