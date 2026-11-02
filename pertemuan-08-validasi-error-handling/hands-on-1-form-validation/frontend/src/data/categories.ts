import type { MenuCategory } from '../types/menu'

export interface CategoryOption {
  value: MenuCategory
  label: string
  hint: string
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'makanan', label: 'Makanan', hint: 'Menu utama' },
  { value: 'minuman', label: 'Minuman', hint: 'Minuman & es' },
  { value: 'camilan', label: 'Camilan', hint: 'Gorengan & snack' },
]

const LABELS: Record<MenuCategory, string> = {
  makanan: 'Makanan',
  minuman: 'Minuman',
  camilan: 'Camilan',
}

export function categoryLabel(category: MenuCategory | null): string {
  if (category === null) return 'Lainnya'
  return LABELS[category]
}
