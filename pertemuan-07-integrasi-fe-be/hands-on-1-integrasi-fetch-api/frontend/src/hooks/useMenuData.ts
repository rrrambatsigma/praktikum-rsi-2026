import { useCallback, useEffect, useRef, useState } from 'react';
import { getMenus, getStalls } from '../lib/api';
import type { MenuItem, Stall } from '../types/menu';

export function useMenuData() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  const reload = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let cancelled = false;

    async function loadData(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const [menuData, stallData] = await Promise.all([getMenus(), getStalls()]);

        if (cancelled || requestId !== requestIdRef.current) return;

        setMenus(menuData);
        setStalls(stallData);
      } catch (caughtError) {
        if (cancelled || requestId !== requestIdRef.current) return;

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Gagal memuat data dari server.',
        );
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return {
    menus,
    stalls,
    isLoading,
    error,
    reload,
  };
}
