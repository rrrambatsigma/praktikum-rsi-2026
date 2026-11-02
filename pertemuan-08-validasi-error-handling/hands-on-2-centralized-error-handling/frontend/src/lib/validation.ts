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

/* ------------------------------------------------------------------ */
/* Validasi register customer                                          */
/* ------------------------------------------------------------------ */

export const USER_NAME_MIN_LENGTH = 2
export const USER_NAME_MAX_LENGTH = 100

export interface RegisterFormValues {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export type RegisterFormField = keyof RegisterFormValues
export type RegisterFormErrors = Partial<Record<RegisterFormField, string>>

export const EMPTY_REGISTER_FORM: RegisterFormValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export const REGISTER_FIELD_ORDER: RegisterFormField[] = [
  'name',
  'email',
  'password',
  'confirmPassword',
]

export interface PasswordCheck {
  label: string
  valid: boolean
}

export function passwordChecks(password: string): PasswordCheck[] {
  return [
    {
      label: `Minimal ${PASSWORD_MIN_LENGTH} karakter`,
      valid: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      label: `Maksimal ${PASSWORD_MAX_LENGTH} karakter`,
      valid: password.length <= PASSWORD_MAX_LENGTH,
    },
    { label: 'Mengandung huruf', valid: /[A-Za-z]/.test(password) },
    { label: 'Mengandung angka', valid: /[0-9]/.test(password) },
  ]
}

export function validateRegisterForm(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {}
  const name = values.name.trim()
  const email = values.email.trim()

  if (!name) {
    errors.name = 'Nama wajib diisi.'
  } else if (name.length < USER_NAME_MIN_LENGTH) {
    errors.name = `Nama minimal ${USER_NAME_MIN_LENGTH} karakter.`
  } else if (name.length > USER_NAME_MAX_LENGTH) {
    errors.name = `Nama maksimal ${USER_NAME_MAX_LENGTH} karakter.`
  }

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
  } else if (!/[A-Za-z]/.test(values.password)) {
    errors.password = 'Password harus mengandung huruf.'
  } else if (!/[0-9]/.test(values.password)) {
    errors.password = 'Password harus mengandung angka.'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Konfirmasi password wajib diisi.'
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Konfirmasi password tidak sama.'
  }

  return errors
}

export function firstRegisterErrorField(
  errors: RegisterFormErrors,
): RegisterFormField | null {
  return REGISTER_FIELD_ORDER.find((field) => errors[field] !== undefined) ?? null
}

/* ------------------------------------------------------------------ */
/* Validasi checkout                                                   */
/* ------------------------------------------------------------------ */

export const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Tunai' },
  { value: 'qris', label: 'QRIS' },
  { value: 'transfer', label: 'Transfer' },
] as const

export type PaymentMethodValue = (typeof PAYMENT_OPTIONS)[number]['value']

export interface CheckoutFormValues {
  customerName: string
  phone: string
  paymentMethod: string
  note: string
}

export type CheckoutFormField = keyof CheckoutFormValues
export type CheckoutFormErrors = Partial<Record<CheckoutFormField, string>>

export const EMPTY_CHECKOUT_FORM: CheckoutFormValues = {
  customerName: '',
  phone: '',
  paymentMethod: 'cash',
  note: '',
}

export const CHECKOUT_FIELD_ORDER: CheckoutFormField[] = [
  'customerName',
  'phone',
  'paymentMethod',
  'note',
]

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '')
}

export function validateCheckoutForm(values: CheckoutFormValues): CheckoutFormErrors {
  const errors: CheckoutFormErrors = {}
  const customerName = values.customerName.trim()
  const phone = normalizePhone(values.phone)

  if (!customerName) {
    errors.customerName = 'Nama penerima wajib diisi.'
  } else if (customerName.length < 2) {
    errors.customerName = 'Nama penerima minimal 2 karakter.'
  } else if (customerName.length > 80) {
    errors.customerName = 'Nama penerima maksimal 80 karakter.'
  }

  if (!values.phone.trim()) {
    errors.phone = 'Nomor telepon wajib diisi.'
  } else if (phone.length < 9) {
    errors.phone = 'Nomor telepon minimal 9 digit.'
  } else if (phone.length > 15) {
    errors.phone = 'Nomor telepon maksimal 15 digit.'
  }

  if (!PAYMENT_OPTIONS.some((option) => option.value === values.paymentMethod)) {
    errors.paymentMethod = 'Metode pembayaran tidak valid.'
  }

  if (values.note.trim().length > 200) {
    errors.note = 'Catatan maksimal 200 karakter.'
  }

  return errors
}

export function firstCheckoutErrorField(
  errors: CheckoutFormErrors,
): CheckoutFormField | null {
  return CHECKOUT_FIELD_ORDER.find((field) => errors[field] !== undefined) ?? null
}

