import type { MenuCategory, MenuPayload } from '../types/menu'

export interface MenuFormValues {
  stallId: string
  name: string
  category: string
  price: string
  description: string
  isAvailable: boolean
}

export type MenuFormField =
  | 'stallId'
  | 'name'
  | 'category'
  | 'price'
  | 'description'

export type MenuFormErrors = Partial<Record<MenuFormField, string>>

export const MENU_CATEGORIES: MenuCategory[] = ['makanan', 'minuman', 'camilan']

export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 100
export const DESCRIPTION_MAX_LENGTH = 255
export const PRICE_MAX = 1_000_000

export const EMPTY_MENU_FORM: MenuFormValues = {
  stallId: '',
  name: '',
  category: '',
  price: '',
  description: '',
  isAvailable: true,
}

export const FIELD_ORDER: MenuFormField[] = [
  'stallId',
  'name',
  'category',
  'price',
  'description',
]

export function validateMenuForm(_values: MenuFormValues): MenuFormErrors {
  // TODO: validasi form menu.
  // - stallId wajib dipilih dan berupa id warung yang valid.
  // - name wajib diisi, minimal NAME_MIN_LENGTH, maksimal NAME_MAX_LENGTH.
  // - category wajib salah satu dari MENU_CATEGORIES.
  // - price wajib bilangan bulat positif, maksimal PRICE_MAX.
  // - description maksimal DESCRIPTION_MAX_LENGTH karakter.
  void _values
  return {}
}

export function toMenuPayload(values: MenuFormValues): MenuPayload {
  return {
    stallId: Number(values.stallId.trim()),
    name: values.name.trim(),
    category: values.category as MenuCategory,
    price: Number(values.price.trim()),
    description: values.description.trim(),
    isAvailable: values.isAvailable,
  }
}

export function firstErrorField(errors: MenuFormErrors): MenuFormField | null {
  return FIELD_ORDER.find((field) => errors[field] !== undefined) ?? null
}

/* ------------------------------------------------------------------ */
/* Validasi login Owner                                                */
/* ------------------------------------------------------------------ */

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72
export const EMAIL_MAX_LENGTH = 150

/**
 * Pemeriksaan format dasar di browser. Backend tetap memakai validator
 * yang lebih ketat; frontend hanya membantu pengguna sebelum request dikirim.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export interface LoginFormValues {
  email: string
  password: string
}

export type LoginFormField = 'email' | 'password'
export type LoginFormErrors = Partial<Record<LoginFormField, string>>

export const EMPTY_LOGIN_FORM: LoginFormValues = {
  email: '',
  password: '',
}

export const LOGIN_FIELD_ORDER: LoginFormField[] = ['email', 'password']

export function validateLoginForm(_values: LoginFormValues): LoginFormErrors {
  // TODO: validasi form login Owner.
  // - email wajib diisi, maksimal EMAIL_MAX_LENGTH, cocok dengan EMAIL_PATTERN.
  // - password wajib diisi, minimal PASSWORD_MIN_LENGTH, maksimal PASSWORD_MAX_LENGTH.
  void _values
  return {}
}

export function firstLoginErrorField(errors: LoginFormErrors): LoginFormField | null {
  return LOGIN_FIELD_ORDER.find((field) => errors[field] !== undefined) ?? null
}
