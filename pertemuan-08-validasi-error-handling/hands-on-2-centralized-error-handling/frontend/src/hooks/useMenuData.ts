import { useCallback, useEffect, useState } from 'react'
import { errorMessage, getMenus, getMyStalls } from '../lib/api'
import type { MenuItem, Stall } from '../types/menu'

interface MenuData {
  menus: MenuItem[]
  stalls: Stall[]
}

export interface MenuDataState {
  menus: MenuItem[]
  stalls: Stall[]
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  reload: () => void
}

/**
 * Dashboard Owner hanya memuat warung miliknya dan menu yang berada di
 * warung tersebut. Katalog publik tetap tersedia lewat GET /api/menu.
 */
async function fetchMenuData(): Promise<MenuData> {
  const [allMenus, myStalls] = await Promise.all([getMenus(), getMyStalls()])
  const ownedStallIds = new Set(myStalls.map((stall) => stall.id))

  return {
    menus: allMenus.filter((menu) => ownedStallIds.has(menu.stallId)),
    stalls: myStalls,
  }
}

export function useMenuData(): MenuDataState {
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [stalls, setStalls] = useState<Stall[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyData = useCallback((data: MenuData) => {
    setMenus(data.menus)
    setStalls(data.stalls)
    setError(null)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadInitialData() {
      try {
        const data = await fetchMenuData()
        if (!cancelled) applyData(data)
      } catch (loadError) {
        if (!cancelled) setError(errorMessage(loadError))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadInitialData()

    return () => {
      cancelled = true
    }
  }, [applyData])

  const reload = useCallback(() => {
    setIsRefreshing(true)

    void fetchMenuData()
      .then(applyData)
      .catch((loadError: unknown) => setError(errorMessage(loadError)))
      .finally(() => setIsRefreshing(false))
  }, [applyData])

  return { menus, stalls, isLoading, isRefreshing, error, reload }
}
