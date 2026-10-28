import { useState } from 'react';
import type { MenuItem, Stall } from '../types/menu';

export function useMenuData() {
  const [menus] = useState<MenuItem[]>([]);
  const [stalls] = useState<Stall[]>([]);

  // TODO: tambahkan state loading, error, reloadKey, dan efek fetch
  // yang memanggil getMenus() dan getStalls().

  return {
    menus,
    stalls,
    isLoading: false,
    error: null as string | null,
    reload: () => {},
  };
}
