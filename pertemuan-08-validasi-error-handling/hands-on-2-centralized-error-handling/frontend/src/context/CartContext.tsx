/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import type { CartItem } from '../types/order'
import type { MenuItem } from '../types/menu'

const STORAGE_KEY = 'maembolo-cart-ho2'

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  total: number
  addItem: (menu: MenuItem) => void
  increment: (menuId: number) => void
  decrement: (menuId: number) => void
  removeItem: (menuId: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function readStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is CartItem => {
      if (typeof item !== 'object' || item === null) return false
      const candidate = item as Partial<CartItem>
      return (
        typeof candidate.menuId === 'number' &&
        typeof candidate.name === 'string' &&
        typeof candidate.stallName === 'string' &&
        typeof candidate.price === 'number' &&
        typeof candidate.quantity === 'number' &&
        candidate.quantity > 0
      )
    })
  } catch {
    return []
  }
}

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>(readStoredCart)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // localStorage bisa penuh atau diblokir; keranjang tetap hidup di memori.
    }
  }, [items])

  const addItem = useCallback((menu: MenuItem) => {
    if (!menu.isAvailable) return

    setItems((current) => {
      const existing = current.find((item) => item.menuId === menu.id)

      if (existing) {
        return current.map((item) =>
          item.menuId === menu.id
            ? { ...item, quantity: Math.min(item.quantity + 1, 20) }
            : item,
        )
      }

      return [
        ...current,
        {
          menuId: menu.id,
          name: menu.name,
          stallName: menu.stallName,
          price: menu.price,
          quantity: 1,
        },
      ]
    })
  }, [])

  const increment = useCallback((menuId: number) => {
    setItems((current) =>
      current.map((item) =>
        item.menuId === menuId
          ? { ...item, quantity: Math.min(item.quantity + 1, 20) }
          : item,
      ),
    )
  }, [])

  const decrement = useCallback((menuId: number) => {
    setItems((current) =>
      current.flatMap((item) => {
        if (item.menuId !== menuId) return [item]
        if (item.quantity <= 1) return []
        return [{ ...item, quantity: item.quantity - 1 }]
      }),
    )
  }, [])

  const removeItem = useCallback((menuId: number) => {
    setItems((current) => current.filter((item) => item.menuId !== menuId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return {
      items,
      itemCount,
      total,
      addItem,
      increment,
      decrement,
      removeItem,
      clear,
    }
  }, [items, addItem, increment, decrement, removeItem, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart harus dipakai di dalam CartProvider.')
  }

  return context
}
