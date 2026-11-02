import { Plus, RefreshCw, Store, WifiOff } from 'lucide-react'
import { useCallback, useState } from 'react'
import { AppFooter } from '../components/AppFooter'
import { AppHeader } from '../components/AppHeader'
import { MenuForm } from '../components/MenuForm'
import { MenuList } from '../components/MenuList'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingPanel,
  Modal,
  PageHeader,
} from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useMenuData } from '../hooks/useMenuData'
import { createMenu, isApiError } from '../lib/api'
import { formatCount, formatRupiah } from '../lib/format'
import type { MenuPayload } from '../types/menu'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const { menus, stalls, isLoading, isRefreshing, error, reload } = useMenuData()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const handleCreateMenu = useCallback(
    async (payload: MenuPayload) => {
      setIsSubmitting(true)

      try {
        const result = await createMenu(payload)

        showToast({
          tone: 'success',
          message: result.message,
          description: `${result.data.name} · ${formatRupiah(result.data.price)}`,
        })

        setIsFormOpen(false)
        reload()
      } catch (submitError) {
        if (isApiError(submitError)) {
          if (submitError.code === 'NETWORK_ERROR') {
            showToast({
              tone: 'error',
              message: 'Koneksi ke server terputus.',
              description: 'Periksa koneksi lalu coba lagi.',
            })
          } else if (submitError.status === 401) {
            showToast({
              tone: 'error',
              message: 'Sesi login berakhir.',
              description: 'Silakan masuk kembali untuk menambah menu.',
            })
          } else if (submitError.code === 'STALL_FORBIDDEN') {
            showToast({
              tone: 'error',
              message: 'Warung bukan milik Anda.',
              description: 'Menu hanya dapat ditambahkan pada warung yang Anda kelola.',
            })
          } else if (submitError.status === 400 || submitError.status === 404) {
            showToast({
              tone: 'error',
              message: 'Menu belum dapat disimpan.',
              description: 'Periksa kembali field yang ditandai merah.',
            })
          } else {
            showToast({
              tone: 'error',
              message: 'Menu gagal disimpan.',
              description: submitError.message,
            })
          }
        } else {
          showToast({
            tone: 'error',
            message: 'Menu gagal disimpan.',
            description: 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.',
          })
        }

        throw submitError
      } finally {
        setIsSubmitting(false)
      }
    },
    [reload, showToast],
  )

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true)

    try {
      await logout()
      showToast({
        tone: 'success',
        message: 'Berhasil keluar.',
        description: 'Sesi login Anda sudah ditutup.',
      })
    } catch (logoutError) {
      showToast({
        tone: 'error',
        message: 'Gagal keluar.',
        description: isApiError(logoutError)
          ? logoutError.message
          : 'Terjadi kesalahan yang tidak terduga.',
      })
    } finally {
      setIsLoggingOut(false)
    }
  }, [logout, showToast])

  const hasLoadError = !isLoading && error !== null && stalls.length === 0
  const unavailableCount = menus.filter((menu) => !menu.isAvailable).length
  const canAddMenu = stalls.length > 0

  return (
    <div className="flex min-h-screen flex-col bg-page text-text">
      <AppHeader
        onRefresh={reload}
        isRefreshing={isRefreshing}
        user={user}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader
          eyebrow="Pemilik Warung"
          title="Dashboard Warung"
          description="Kelola menu pada warung yang Anda miliki."
          actions={
            <Button
              onClick={() => setIsFormOpen(true)}
              disabled={isLoading || !canAddMenu}
            >
              <Plus className="size-4" aria-hidden="true" />
              Tambah Menu
            </Button>
          }
        />

        {error && !hasLoadError ? (
          <div className="mb-4">
            <Alert tone="error">{error}</Alert>
          </div>
        ) : null}

        {isLoading ? (
          <LoadingPanel message="Memuat data warung..." />
        ) : hasLoadError ? (
          <EmptyState
            icon={WifiOff}
            title="Data warung belum bisa dimuat"
            message={error ?? 'Periksa koneksi lalu coba lagi.'}
            action={
              <Button variant="secondary" onClick={reload}>
                <RefreshCw className="size-4" aria-hidden="true" />
                Coba Lagi
              </Button>
            }
          />
        ) : stalls.length === 0 ? (
          <EmptyState
            icon={Store}
            title="Belum ada warung"
            message="Akun ini belum terhubung ke warung mana pun. Hubungi admin untuk menambahkan warung pada akun Anda."
          />
        ) : (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <Card className="p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Warung
                </p>
                <p className="m-0 text-2xl font-extrabold text-primary-dark">
                  {stalls.length}
                </p>
              </Card>
              <Card className="p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Menu
                </p>
                <p className="m-0 text-2xl font-extrabold text-primary-dark">
                  {menus.length}
                </p>
              </Card>
              <Card className="p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Menu habis
                </p>
                <p className="m-0 text-2xl font-extrabold text-primary-dark">
                  {unavailableCount}
                </p>
              </Card>
            </div>

            <section className="mb-8" aria-labelledby="my-stalls-title">
              <h2 id="my-stalls-title" className="mb-3 text-xl font-bold">
                Warung Saya
              </h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {stalls.map((stall) => {
                  const menuCount = menus.filter((menu) => menu.stallId === stall.id).length

                  return (
                    <Card key={stall.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-1 flex flex-wrap gap-2">
                            {stall.category ? (
                              <Badge tone="primary">{stall.category}</Badge>
                            ) : null}
                          </div>
                          <h3 className="mb-1 text-lg font-bold">{stall.name}</h3>
                          <p className="mb-0 text-xs text-text-muted">
                            {stall.location || 'Lokasi belum diisi'}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-text-muted">
                          {formatCount(menuCount, 'menu', 'menu')}
                        </span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </section>

            <MenuList menus={menus} onAdd={() => setIsFormOpen(true)} />
          </>
        )}
      </main>

      <AppFooter user={user} />

      {isFormOpen ? (
        <Modal
          title="Tambah Menu"
          onClose={() => {
            if (!isSubmitting) setIsFormOpen(false)
          }}
        >
          <MenuForm
            stalls={stalls}
            isSubmitting={isSubmitting}
            onSubmit={handleCreateMenu}
            onCancel={() => setIsFormOpen(false)}
          />
        </Modal>
      ) : null}
    </div>
  )
}
