import { Plus, RefreshCw, Store, Trash2, WifiOff } from 'lucide-react'
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
  Spinner,
} from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLogout } from '../hooks/useLogout'
import { useMenuData } from '../hooks/useMenuData'
import { createMenu, deleteMenu, isApiError, updateMenu } from '../lib/api'
import { formatCount, formatRupiah } from '../lib/format'
import type { MenuItem, MenuPayload } from '../types/menu'

function submitErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.'
  }

  if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
    return 'Koneksi ke server terputus. Periksa koneksi lalu coba lagi.'
  }

  if (error.code === 'STALL_FORBIDDEN') {
    return 'Warung ini bukan milik akun Anda.'
  }

  if (error.code === 'MENU_FORBIDDEN') {
    return 'Menu ini bukan milik akun Anda.'
  }

  if (error.code === 'MENU_NAME_TAKEN') {
    return 'Nama menu sudah dipakai di warung ini.'
  }

  if (error.code === 'MENU_NOT_FOUND') {
    return 'Menu sudah tidak ada. Muat ulang daftar menu.'
  }

  if (error.status === 401) {
    return 'Sesi login berakhir. Silakan masuk kembali.'
  }

  return error.message
}

export function DashboardPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { handleLogout, isLoggingOut } = useLogout()
  const { menus, stalls, isLoading, isRefreshing, error, reload } = useMenuData()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [menuToDelete, setMenuToDelete] = useState<MenuItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const closeForm = useCallback(() => {
    if (isSubmitting) return
    setIsFormOpen(false)
    setEditingMenu(null)
  }, [isSubmitting])

  const handleSubmitMenu = useCallback(
    async (payload: MenuPayload) => {
      setIsSubmitting(true)

      try {
        const result = editingMenu
          ? await updateMenu(editingMenu.id, payload)
          : await createMenu(payload)

        showToast({
          tone: 'success',
          message: result.message,
          description: `${result.data.name} · ${formatRupiah(result.data.price)}`,
        })

        setIsFormOpen(false)
        setEditingMenu(null)
        reload()
      } catch (submitError) {
        showToast({
          tone: 'error',
          message: editingMenu ? 'Menu gagal diperbarui.' : 'Menu gagal disimpan.',
          description: submitErrorMessage(submitError),
        })

        throw submitError
      } finally {
        setIsSubmitting(false)
      }
    },
    [editingMenu, reload, showToast],
  )

  const handleEdit = useCallback((menu: MenuItem) => {
    setEditingMenu(menu)
    setIsFormOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!menuToDelete) return

    setIsDeleting(true)

    try {
      await deleteMenu(menuToDelete.id)
      showToast({
        tone: 'success',
        message: 'Menu berhasil dihapus.',
        description: menuToDelete.name,
      })
      setMenuToDelete(null)
      reload()
    } catch (deleteError) {
      showToast({
        tone: 'error',
        message: 'Menu gagal dihapus.',
        description: submitErrorMessage(deleteError),
      })
    } finally {
      setIsDeleting(false)
    }
  }, [menuToDelete, reload, showToast])

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
          description="Kelola menu pada warung yang Anda miliki: tambah, ubah, atau hapus."
          actions={
            <Button
              onClick={() => {
                setEditingMenu(null)
                setIsFormOpen(true)
              }}
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

            <MenuList
              menus={menus}
              onAdd={() => {
                setEditingMenu(null)
                setIsFormOpen(true)
              }}
              onEdit={handleEdit}
              onDelete={setMenuToDelete}
            />
          </>
        )}
      </main>

      <AppFooter user={user} />

      {isFormOpen ? (
        <Modal
          title={editingMenu ? 'Edit Menu' : 'Tambah Menu'}
          onClose={closeForm}
        >
          <MenuForm
            key={editingMenu?.id ?? 'create'}
            stalls={stalls}
            isSubmitting={isSubmitting}
            initialMenu={editingMenu}
            onSubmit={handleSubmitMenu}
            onCancel={closeForm}
          />
        </Modal>
      ) : null}

      {menuToDelete ? (
        <Modal
          title="Hapus menu?"
          onClose={() => {
            if (!isDeleting) setMenuToDelete(null)
          }}
        >
          <div className="space-y-4">
            <div className="rounded-control bg-danger-bg px-3.5 py-3 text-sm text-danger">
              <p className="m-0 flex items-start gap-2 font-semibold">
                <Trash2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Menu akan dihapus permanen.
              </p>
              <p className="mb-0 mt-1 pl-6 text-danger/80">
                {menuToDelete.name} · {formatRupiah(menuToDelete.price)}
              </p>
            </div>
            <p className="mb-0 text-sm leading-relaxed text-text-muted">
              Pesanan lama tetap menyimpan nama dan harga menu ini sebagai snapshot.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={() => setMenuToDelete(null)}
                disabled={isDeleting}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={() => void handleConfirmDelete()}
                disabled={isDeleting}
              >
                {isDeleting ? <Spinner /> : <Trash2 className="size-4" aria-hidden="true" />}
                {isDeleting ? 'Menghapus...' : 'Hapus menu'}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
