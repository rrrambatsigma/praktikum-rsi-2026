import type { OrderItem } from '../types/order'

export interface StallGroup {
  key: string
  stallId: number | null
  stallName: string
  items: OrderItem[]
  subtotal: number
}

/**
 * Satu struk bisa berisi item dari beberapa warung. Kelompokkan item
 * berdasarkan snapshot warung agar customer, admin, dan owner melihat
 * tiket yang sesuai.
 */
export function groupItemsByStall(items: OrderItem[]): StallGroup[] {
  const groups = new Map<string, StallGroup>()

  for (const item of items) {
    const key = item.stallId === null ? `name:${item.stallName}` : `id:${item.stallId}`
    const existing = groups.get(key)

    if (existing) {
      existing.items.push(item)
      existing.subtotal += item.subtotal
      continue
    }

    groups.set(key, {
      key,
      stallId: item.stallId,
      stallName: item.stallName,
      items: [item],
      subtotal: item.subtotal,
    })
  }

  return [...groups.values()]
}
