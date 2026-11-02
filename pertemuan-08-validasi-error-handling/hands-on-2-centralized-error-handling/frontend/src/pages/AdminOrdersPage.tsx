import {
  CheckCircle2,
  ClipboardList,
  Eye,
  RefreshCw,
  ShieldCheck,
  XCircle,
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
  Modal,
  PageHeader,
  Spinner,
  type BadgeTone,
} from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLogout } from '../hooks/useLogout'
import {
  errorMessage,
  getAllOrders,
  getOrderDetail,
  updateOrderStatus,
} from '../lib/api'
import { formatDateTime, formatRupiah, paymentLabel, statusLabel } from '../lib/format'
import { groupItemsByStall } from '../lib/order'
import type { AdminOrder, Order, OrderStatus } from '../types/order'

const statusTone: Record<OrderStatus, BadgeTone> = {
  confirmed: 'primary',
  completed: 'success',
  cancelled: 'danger',
}

type FinalStatus = Exclude<OrderStatus, 'confirmed'>

export function AdminOrdersPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { handleLogout, isLoggingOut } = useLogout()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [detailOrderId, setDetailOrderId] = useState<number | null>(null)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<FinalStatus | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const loadOrders = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const data = await getAllOrders()
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

    getAllOrders()
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

  const openDetail = useCallback(async (id: number) => {
    setDetailOrderId(id)
    setDetailOrder(null)
    setDetailError(null)
    setPendingStatus(null)
    setIsDetailLoading(true)

    try {
      const data = await getOrderDetail(id)
      setDetailOrder(data)
    } catch (loadError) {
      setDetailError(errorMessage(loadError))
    } finally {
      setIsDetailLoading(false)
    }
  }, [])

  const closeDetail = useCallback(() => {
    if (isUpdating) return
    setDetailOrderId(null)
    setDetailOrder(null)
    setDetailError(null)
    setPendingStatus(null)
  }, [isUpdating])

  const applyStatus = useCallback(
    async (status: FinalStatus) => {
      if (!detailOrder) return

      setIsUpdating(true)

      try {
        const result = await updateOrderStatus(detailOrder.id, status)
        setDetailOrder(result.data)
        setOrders((current) =>
          current.map((order) =>
            order.id === result.data.id ? { ...order, status: result.data.status } : order,
          ),
        )
        setPendingStatus(null)
        showToast({ tone: 'success', message: result.message })
      } catch (updateError) {
        showToast({ tone: 'error', message: errorMessage(updateError) })
      } finally {
        setIsUpdating(false)
      }
    },
    [detailOrder, showToast],
  )

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const groups = detailOrder ? groupItemsByStall(detailOrder.items) : []

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
          eyebrow="Admin"
          title="Semua Pesanan"
          description="Admin memantau pesanan, melihat rincian item per warung, dan memproses status pesanan."
          actions={
            <span className="inline-flex min-h-10 items-center gap-2 rounded-control border border-border bg-surface px-3 text-xs font-semibold text-text-muted">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              Operasional kantin
            </span>
          }
        />

        {error ? (
          <div className="mb-4">
            <Alert tone="error" title="Pesanan belum bisa dimuat">
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
          <LoadingPanel message="Memuat semua pesanan..." />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Belum ada pesanan"
            message="Pesanan customer akan muncul di sini setelah checkout."
          />
        ) : (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <Card className="p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Total pesanan
                </p>
                <p className="m-0 text-2xl font-extrabold text-primary-dark">{orders.length}</p>
              </Card>
              <Card className="p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Nilai pesanan
                </p>
                <p className="m-0 text-2xl font-extrabold text-primary-dark">
                  {formatRupiah(totalRevenue)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Dikonfirmasi
                </p>
                <p className="m-0 text-2xl font-extrabold text-primary-dark">
                  {orders.filter((order) => order.status === 'confirmed').length}
                </p>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/60 text-[11px] uppercase tracking-wider text-text-muted">
                      <th scope="col" className="px-4 py-3 font-bold">Kode</th>
                      <th scope="col" className="px-4 py-3 font-bold">Customer</th>
                      <th scope="col" className="px-4 py-3 font-bold">Telepon</th>
                      <th scope="col" className="px-4 py-3 font-bold">Bayar</th>
                      <th scope="col" className="px-4 py-3 text-right font-bold">Item</th>
                      <th scope="col" className="px-4 py-3 text-right font-bold">Total</th>
                      <th scope="col" className="px-4 py-3 font-bold">Status</th>
                      <th scope="col" className="px-4 py-3 font-bold">Dibuat</th>
                      <th scope="col" className="px-4 py-3 text-right font-bold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-border/70 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-primary-dark">
                          {order.orderCode}
                        </td>
                        <td className="px-4 py-3 font-semibold">{order.customerName}</td>
                        <td className="px-4 py-3 text-text-muted">{order.phone}</td>
                        <td className="px-4 py-3 text-text-muted">{paymentLabel(order.paymentMethod)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{order.itemCount}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {formatRupiah(order.total)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone[order.status]}>{statusLabel(order.status)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-muted">
                          {formatDateTime(order.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="secondary"
                            className="min-h-8 px-2.5 text-xs"
                            onClick={() => void openDetail(order.id)}
                          >
                            <Eye className="size-3.5" aria-hidden="true" />
                            Detail
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <p className="mb-0 mt-3 flex items-center gap-1.5 text-xs text-text-muted">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Admin hanya memproses status pesanan; isi pesanan dan harga tidak dapat diubah.
            </p>
          </>
        )}
      </main>

      <AppFooter user={user} />

      {detailOrderId !== null ? (
        <Modal
          title="Detail Pesanan"
          onClose={closeDetail}
          footer={
            <>
              {detailOrder?.status === 'confirmed' ? (
                <>
                  <Button
                    variant="danger"
                    onClick={() => setPendingStatus('cancelled')}
                    disabled={isUpdating}
                  >
                    <XCircle className="size-4" aria-hidden="true" />
                    Batalkan
                  </Button>
                  <Button
                    onClick={() => setPendingStatus('completed')}
                    disabled={isUpdating}
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Selesaikan
                  </Button>
                </>
              ) : (
                <Button variant="secondary" onClick={closeDetail} disabled={isUpdating}>
                  Tutup
                </Button>
              )}
            </>
          }
        >
          {isDetailLoading ? (
            <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-text-muted">
              <Spinner className="size-5 text-primary" />
              Memuat detail pesanan...
            </div>
          ) : detailError ? (
            <Alert tone="error" title="Detail belum bisa dimuat">
              {detailError}
            </Alert>
          ) : detailOrder ? (
            <div className="space-y-4">
              <div className="rounded-control border border-dashed border-border bg-surface-muted/50 p-3 text-center">
                <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Kode pesanan
                </p>
                <p className="m-0 mt-1 font-mono text-base font-extrabold text-primary-dark">
                  {detailOrder.orderCode}
                </p>
              </div>

              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-text-muted">Customer</dt>
                  <dd className="m-0 font-semibold">{detailOrder.customerName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Telepon</dt>
                  <dd className="m-0 font-semibold">{detailOrder.phone}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Pembayaran</dt>
                  <dd className="m-0 font-semibold">{paymentLabel(detailOrder.paymentMethod)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Status</dt>
                  <dd className="m-0">
                    <Badge tone={statusTone[detailOrder.status]}>
                      {statusLabel(detailOrder.status)}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Dibuat</dt>
                  <dd className="m-0 font-semibold">{formatDateTime(detailOrder.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Jumlah item</dt>
                  <dd className="m-0 font-semibold">{detailOrder.items.length} item</dd>
                </div>
              </dl>

              {detailOrder.note ? (
                <p className="m-0 rounded-control bg-surface-muted px-3 py-2 text-xs text-text-muted">
                  Catatan: {detailOrder.note}
                </p>
              ) : null}

              <div className="space-y-4 border-t border-border pt-3">
                {groups.map((group) => (
                  <section key={group.key} aria-label={`Item dari ${group.stallName}`}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h3 className="m-0 text-sm font-extrabold text-primary-dark">
                        {group.stallName}
                      </h3>
                      <span className="text-xs font-semibold text-text-muted">
                        {formatRupiah(group.subtotal)}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {group.items.map((item, index) => (
                        <li
                          key={item.menuId ?? `${group.key}-${index}`}
                          className="flex items-start justify-between gap-3 text-sm"
                        >
                          <div>
                            <p className="m-0 font-semibold">{item.menuName}</p>
                            <p className="m-0 text-xs text-text-muted">
                              {item.quantity} x {formatRupiah(item.unitPrice)}
                            </p>
                          </div>
                          <span className="font-semibold">{formatRupiah(item.subtotal)}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-sm text-text-muted">Total</span>
                <span className="text-lg font-extrabold text-primary-dark">
                  {formatRupiah(detailOrder.total)}
                </span>
              </div>

              {pendingStatus ? (
                <Alert
                  tone={pendingStatus === 'cancelled' ? 'warning' : 'info'}
                  title={
                    pendingStatus === 'cancelled'
                      ? 'Batalkan pesanan ini?'
                      : 'Selesaikan pesanan ini?'
                  }
                >
                  <p className="m-0">
                    Status akan berubah menjadi{' '}
                    <strong>{statusLabel(pendingStatus)}</strong> dan tidak dapat diubah lagi.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setPendingStatus(null)}
                      disabled={isUpdating}
                    >
                      Kembali
                    </Button>
                    <Button
                      variant={pendingStatus === 'cancelled' ? 'danger' : 'primary'}
                      onClick={() => void applyStatus(pendingStatus)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Spinner /> : null}
                      {pendingStatus === 'cancelled' ? 'Ya, batalkan' : 'Ya, selesaikan'}
                    </Button>
                  </div>
                </Alert>
              ) : null}
            </div>
          ) : null}
        </Modal>
      ) : null}
    </div>
  )
}
