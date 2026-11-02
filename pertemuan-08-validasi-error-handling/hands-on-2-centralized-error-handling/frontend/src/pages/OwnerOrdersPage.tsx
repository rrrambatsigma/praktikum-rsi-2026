import {
  ClipboardList,
  RefreshCw,
  ShieldCheck,
  Store,
  UtensilsCrossed,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
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
  type BadgeTone,
} from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useLogout } from '../hooks/useLogout'
import { errorMessage, getMyOrders } from '../lib/api'
import { formatDateTime, formatRupiah, paymentLabel, statusLabel } from '../lib/format'
import { groupItemsByStall } from '../lib/order'
import type { OrderStatus, OwnerOrder } from '../types/order'

const statusTone: Record<OrderStatus, BadgeTone> = {
  confirmed: 'primary',
  completed: 'success',
  cancelled: 'danger',
}

export function OwnerOrdersPage() {
  const { user } = useAuth()
  const { handleLogout, isLoggingOut } = useLogout()
  const [orders, setOrders] = useState<OwnerOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadOrders = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const data = await getMyOrders()
      setOrders(data)
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

    getMyOrders()
      .then((data) => {
        if (!active) return
        setOrders(data)
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

  const totalItems = orders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  )
  const totalValue = orders.reduce((sum, order) => sum + order.ownerTotal, 0)

  return (
    <div className="flex min-h-screen flex-col bg-page text-text">
      <AppHeader
        onRefresh={() => void loadOrders(true)}
        isRefreshing={isRefreshing}
        user={user}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader
          eyebrow="Owner"
          title="Tiket Pesanan Warung"
          description="Satu pesanan customer bisa berisi menu dari beberapa warung. Di sini Anda hanya melihat item yang berasal dari warung Anda."
          actions={
            <span className="inline-flex min-h-10 items-center gap-2 rounded-control border border-border bg-surface px-3 text-xs font-semibold text-text-muted">
              <Store className="size-4 text-primary" aria-hidden="true" />
              Tiket per warung
            </span>
          }
        />

        {error ? (
          <div className="mb-4">
            <Alert tone="error" title="Tiket pesanan belum bisa dimuat">
              <div className="flex flex-wrap items-center gap-2">
                <span>{error}</span>
                <Button variant="secondary" onClick={() => void loadOrders(true)}>
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Coba lagi
                </Button>
              </div>
            </Alert>
          </div>
        ) : null}

        {isLoading ? (
          <LoadingPanel message="Memuat tiket pesanan warung..." />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Belum ada tiket pesanan"
            message="Tiket akan muncul saat customer memesan menu dari warung Anda."
          />
        ) : (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <Card className="p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Tiket masuk
                </p>
                <p className="m-0 text-2xl font-extrabold text-primary-dark">{orders.length}</p>
              </Card>
              <Card className="p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Item terjual
                </p>
                <p className="m-0 text-2xl font-extrabold text-primary-dark">{totalItems}</p>
              </Card>
              <Card className="p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Nilai tiket
                </p>
                <p className="m-0 text-2xl font-extrabold text-primary-dark">
                  {formatRupiah(totalValue)}
                </p>
              </Card>
            </div>

            <div className="grid gap-4">
              {orders.map((order) => {
                const groups = groupItemsByStall(order.items)

                return (
                  <Card key={order.id} className="overflow-hidden">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-surface-muted/40 px-4 py-3">
                      <div>
                        <p className="m-0 font-mono text-sm font-extrabold text-primary-dark">
                          {order.orderCode}
                        </p>
                        <p className="m-0 mt-1 text-xs text-text-muted">
                          {formatDateTime(order.createdAt)} | {order.customerName} |{' '}
                          {order.phone}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="neutral">{paymentLabel(order.paymentMethod)}</Badge>
                        <Badge tone={statusTone[order.status]}>{statusLabel(order.status)}</Badge>
                      </div>
                    </div>

                    <div className="space-y-4 px-4 py-4">
                      {groups.map((group) => (
                        <section key={group.key} aria-label={`Item dari ${group.stallName}`}>
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <h2 className="m-0 flex items-center gap-1.5 text-sm font-extrabold text-primary-dark">
                              <UtensilsCrossed className="size-4" aria-hidden="true" />
                              {group.stallName}
                            </h2>
                            <span className="text-xs font-semibold text-text-muted">
                              {formatRupiah(group.subtotal)}
                            </span>
                          </div>
                          <ul className="space-y-2">
                            {group.items.map((item, index) => (
                              <li
                                key={item.menuId ?? `${group.key}-${index}`}
                                className="flex items-start justify-between gap-3 rounded-control bg-surface-muted/50 px-3 py-2 text-sm"
                              >
                                <div>
                                  <p className="m-0 font-semibold">{item.menuName}</p>
                                  <p className="m-0 text-xs text-text-muted">
                                    {item.quantity} x {formatRupiah(item.unitPrice)}
                                  </p>
                                </div>
                                <span className="font-semibold">
                                  {formatRupiah(item.subtotal)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}

                      {order.note ? (
                        <p className="m-0 rounded-control bg-surface-muted px-3 py-2 text-xs text-text-muted">
                          Catatan customer: {order.note}
                        </p>
                      ) : null}

                      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                        <span className="text-sm text-text-muted">Total tiket warung</span>
                        <span className="text-lg font-extrabold text-primary-dark">
                          {formatRupiah(order.ownerTotal)}
                        </span>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            <p className="mb-0 mt-3 flex items-center gap-1.5 text-xs text-text-muted">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Status pesanan diproses oleh admin. Owner tidak dapat mengubah status atau harga.
            </p>
          </>
        )}
      </main>

      <AppFooter user={user} />
    </div>
  )
}
