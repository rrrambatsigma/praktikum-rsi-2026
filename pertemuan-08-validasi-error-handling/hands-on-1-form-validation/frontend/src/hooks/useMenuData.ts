import { useCallback, useEffect, useState } from 'react'
import { errorMessage, getMenus, getStalls } from '../lib/api'
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

async function fetchMenuData(): Promise<MenuData> {
  const [menus, stalls] = await Promise.all([getMenus(), getStalls()])
  return { menus, stalls }
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
