export type UserRole = 'admin' | 'owner' | 'customer'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export function homeForRole(role: UserRole): string {
  if (role === 'owner') return '/dashboard'
  if (role === 'admin') return '/admin/orders'
  return '/'
}
