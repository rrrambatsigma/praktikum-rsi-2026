import {
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppFooter } from '../components/AppFooter'
import { AppHeader } from '../components/AppHeader'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingPanel,
  PageHeader,
} from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useLogout } from '../hooks/useLogout'
import { errorMessage, getMenus } from '../lib/api'
import { categoryLabel, CATEGORY_OPTIONS } from '../data/categories'
import { formatRupiah } from '../lib/format'
import type { MenuCategory, MenuItem } from '../types/menu'

const CATEGORY_FILTERS = [
  { value: 'semua', label: 'Semua' },
  ...CATEGORY_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  })),
] as const

export function CatalogPage() {
  const { user } = useAuth()
  const { items, itemCount, total, addItem, increment, decrement, removeItem } = useCart()
  const { showToast } = useToast()
  const { handleLogout, isLoggingOut } = useLogout()

  const [menus, setMenus] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('semua')

  const loadMenus = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const data = await getMenus()
      setMenus(data)
      setError(null)
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    getMenus()
      .then((data) => {
        if (!active) return
        setMenus(data)
        setError(null)
      })
      .catch((loadError: unknown) => {
        if (active) setError(errorMessage(loadError))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filteredMenus = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return menus.filter((menu) => {
      const matchesCategory =
        category === 'semua' || menu.category === (category as MenuCategory)
      const matchesQuery =
        normalizedQuery.length === 0 ||
        menu.name.toLowerCase().includes(normalizedQuery) ||
        menu.stallName.toLowerCase().includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [menus, query, category])

  const canOrder = user?.role === 'customer'

  function handleAdd(menu: MenuItem) {
    if (!canOrder) {
      showToast({
        tone: 'info',
        message: 'Masuk sebagai customer untuk memesan.',
        description: 'Akun owner dan admin tidak dapat membuat pesanan.',
      })
      return
    }

    addItem(menu)
    showToast({
      tone: 'success',
      message: 'Ditambahkan ke keranjang.',
      description: `${menu.name} · ${formatRupiah(menu.price)}`,
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-page text-text">
      <AppHeader
        onRefresh={() => void loadMenus(true)}
        isRefreshing={isRefreshing}
        user={user}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader
          eyebrow="Review Kantin"
          title="Katalog Kantin"
          description="Pilih menu dari warung sekitar. Pesanan hanya dapat dibuat oleh akun customer."
          actions={
            user?.role === 'customer' ? (
              <Link
                to="/checkout"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                <ShoppingCart className="size-4" aria-hidden="true" />
                Keranjang ({itemCount})
              </Link>
            ) : null
          }
        />

        {error ? (
          <div className="mb-4">
            <Alert tone="error" title="Katalog belum bisa dimuat">
              <div className="flex flex-wrap items-center gap-2">
                <span>{error}</span>
                <Button variant="secondary" onClick={() => void loadMenus(true)}>
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Coba lagi
                </Button>
              </div>
            </Alert>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section aria-labelledby="catalog-title">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 id="catalog-title" className="m-0 text-xl font-bold">
                Menu tersedia
              </h2>
              <div className="relative w-full sm:max-w-xs">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  placeholder="Cari menu atau warung"
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-10 w-full rounded-control border border-border bg-surface pl-9 pr-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {CATEGORY_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setCategory(filter.value)}
                  aria-pressed={category === filter.value}
                  className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold transition ${
                    category === filter.value
                      ? 'bg-primary text-white'
                      : 'border border-border bg-surface text-text-muted hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <LoadingPanel message="Memuat katalog..." />
            ) : filteredMenus.length === 0 ? (
              <EmptyState
                icon={UtensilsCrossed}
                title="Menu tidak ditemukan"
                message="Coba kata kunci atau kategori lain."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredMenus.map((menu) => (
                  <Card key={menu.id} className="flex flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="mb-0.5 truncate text-sm font-bold">{menu.name}</h3>
                        <p className="mb-0 flex items-center gap-1 text-[11px] text-text-muted">
                          <Store className="size-3 shrink-0" aria-hidden="true" />
                          <span className="truncate">{menu.stallName}</span>
                        </p>
                      </div>
                      <Badge tone={menu.isAvailable ? 'success' : 'danger'}>
                        {menu.isAvailable ? 'Tersedia' : 'Habis'}
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge tone="primary">{categoryLabel(menu.category)}</Badge>
                    </div>

                    {menu.description ? (
                      <p className="mb-0 mt-2 line-clamp-2 text-xs leading-relaxed text-text-muted">
                        {menu.description}
                      </p>
                    ) : null}

                    <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                      <p className="m-0 text-base font-extrabold text-primary-dark">
                        {formatRupiah(menu.price)}
                      </p>
                      <Button
                        onClick={() => handleAdd(menu)}
                        disabled={!menu.isAvailable}
                        className="min-h-9 px-3 text-xs"
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        Tambah
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <aside aria-label="Keranjang" className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="m-0 flex items-center gap-2 text-lg font-bold">
                  <ShoppingCart className="size-5 text-primary" aria-hidden="true" />
                  Keranjang
                </h2>
                <Badge tone="neutral">{itemCount} item</Badge>
              </div>

              {items.length === 0 ? (
                <p className="mb-0 mt-3 text-sm leading-relaxed text-text-muted">
                  Belum ada menu. Tambahkan menu untuk mulai memesan.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {items.map((item) => (
                    <li key={item.menuId} className="rounded-control bg-surface-muted/60 p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="m-0 truncate text-xs font-bold">{item.name}</p>
                          <p className="m-0 text-[11px] text-text-muted">{item.stallName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.menuId)}
                          aria-label={`Hapus ${item.name}`}
                          className="grid size-7 shrink-0 place-items-center rounded-control text-text-muted transition hover:bg-danger-bg hover:text-danger"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-control border border-border bg-surface">
                          <button
                            type="button"
                            onClick={() => decrement(item.menuId)}
                            aria-label={`Kurangi ${item.name}`}
                            className="grid size-7 place-items-center text-text-muted hover:text-primary"
                          >
                            <Minus className="size-3" aria-hidden="true" />
                          </button>
                          <span className="min-w-6 text-center text-xs font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => increment(item.menuId)}
                            aria-label={`Tambah ${item.name}`}
                            className="grid size-7 place-items-center text-text-muted hover:text-primary"
                          >
                            <Plus className="size-3" aria-hidden="true" />
                          </button>
                        </div>
                        <span className="text-xs font-bold text-primary-dark">
                          {formatRupiah(item.price * item.quantity)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 border-t border-border pt-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-text-muted">Total</span>
                  <span className="font-extrabold text-primary-dark">{formatRupiah(total)}</span>
                </div>

                {canOrder ? (
                  <Link
                    to="/checkout"
                    className={`mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover ${
                      items.length === 0 ? 'pointer-events-none opacity-50' : ''
                    }`}
                    aria-disabled={items.length === 0}
                  >
                    Lanjut ke checkout
                  </Link>
                ) : (
                  <p className="mb-0 mt-3 rounded-control bg-surface-muted px-3 py-2 text-xs leading-relaxed text-text-muted">
                    {user
                      ? 'Hanya akun customer yang dapat membuat pesanan.'
                      : 'Masuk sebagai customer untuk membuat pesanan.'}
                  </p>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </main>

      <AppFooter user={user} />
    </div>
  )
}
