import type { UserRole } from '../types/auth'

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function formatRupiah(value: number): string {
  return rupiah.format(value)
}

export function formatCount(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`
}

export function formatRole(role: UserRole): string {
  if (role === 'owner') return 'Pemilik Warung'
  if (role === 'admin') return 'Admin'
  return 'Pelanggan'
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return 'MB'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}
