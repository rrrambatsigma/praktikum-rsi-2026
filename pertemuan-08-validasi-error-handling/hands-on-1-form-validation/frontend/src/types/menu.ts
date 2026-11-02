export type MenuCategory = 'makanan' | 'minuman' | 'camilan'

export interface MenuItem {
  id: number
  stallId: number
  stallName: string
  name: string
  category: MenuCategory | null
  price: number
  description: string | null
  isAvailable: boolean
}

export interface Stall {
  id: number
  ownerId: number
  name: string
  category: string | null
  location: string | null
}

export interface MenuPayload {
  stallId: number
  name: string
  category: MenuCategory
  price: number
  description: string
  isAvailable: boolean
}

export interface ApiErrorDetail {
  field: string
  message: string
}

export interface ApiSuccess<T> {
  status: 'success'
  message?: string
  data: T
}

export interface ApiFailure {
  status: 'fail' | 'error'
  code?: string
  message?: string
  errors?: ApiErrorDetail[]
}

export interface CreateMenuResult {
  message: string
  data: MenuItem
}
