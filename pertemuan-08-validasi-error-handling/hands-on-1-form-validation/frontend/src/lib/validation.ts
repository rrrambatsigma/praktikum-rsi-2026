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

function isPositiveIntegerText(value: string): boolean {
  return /^\d+$/.test(value)
}

export function validateMenuForm(values: MenuFormValues): MenuFormErrors {
  const errors: MenuFormErrors = {}

  if (!values.stallId.trim()) {
    errors.stallId = 'Pilih warung terlebih dahulu.'
  } else if (!isPositiveIntegerText(values.stallId) || Number(values.stallId) <= 0) {
    errors.stallId = 'Warung yang dipilih tidak valid.'
  }

  const name = values.name.trim()

  if (!name) {
    errors.name = 'Nama menu wajib diisi.'
  } else if (name.length < NAME_MIN_LENGTH) {
    errors.name = `Nama menu minimal ${NAME_MIN_LENGTH} karakter.`
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Nama menu maksimal ${NAME_MAX_LENGTH} karakter.`
  }

  if (!values.category.trim()) {
    errors.category = 'Pilih kategori menu.'
  } else if (!MENU_CATEGORIES.includes(values.category as MenuCategory)) {
    errors.category = 'Kategori menu tidak valid.'
  }

  const price = values.price.trim()

  if (!price) {
    errors.price = 'Harga wajib diisi.'
  } else if (!isPositiveIntegerText(price)) {
    errors.price = 'Harga harus berupa angka bulat tanpa titik atau koma.'
  } else {
    const priceNumber = Number(price)

    if (priceNumber <= 0) {
      errors.price = 'Harga harus lebih dari 0.'
    } else if (priceNumber > PRICE_MAX) {
      errors.price = `Harga maksimal Rp${PRICE_MAX.toLocaleString('id-ID')}.`
    }
  }

  if (values.description.trim().length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Deskripsi maksimal ${DESCRIPTION_MAX_LENGTH} karakter.`
  }

  return errors
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

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {}
  const email = values.email.trim()

  if (!email) {
    errors.email = 'Email wajib diisi.'
  } else if (email.length > EMAIL_MAX_LENGTH) {
    errors.email = `Email maksimal ${EMAIL_MAX_LENGTH} karakter.`
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Format email tidak valid.'
  }

  if (!values.password) {
    errors.password = 'Password wajib diisi.'
  } else if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password minimal ${PASSWORD_MIN_LENGTH} karakter.`
  } else if (values.password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `Password maksimal ${PASSWORD_MAX_LENGTH} karakter.`
  }

  return errors
}

export function firstLoginErrorField(errors: LoginFormErrors): LoginFormField | null {
  return LOGIN_FIELD_ORDER.find((field) => errors[field] !== undefined) ?? null
}
