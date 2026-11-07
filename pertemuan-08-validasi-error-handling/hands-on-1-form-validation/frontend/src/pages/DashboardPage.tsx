import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Alert } from '../components/Alert'
import { AppFooter } from '../components/AppFooter'
import { AppHeader, type ApiStatus } from '../components/AppHeader'
import { MenuForm } from '../components/MenuForm'
import { MenuList } from '../components/MenuList'
import {
  ErrorPanel,
  ListSkeleton,
  LoadingPanel,
} from '../components/StatePanel'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useMenuData } from '../hooks/useMenuData'
import { createMenu, isApiError } from '../lib/api'
import { formatRupiah } from '../lib/format'
import type { MenuPayload } from '../types/menu'

const steps = [
  {
    title: 'Validasi frontend',
    description: 'Form menolak input kosong atau tidak masuk akal sebelum request dikirim.',
  },
  {
    title: 'Backend memeriksa ulang',
    description: 'Payload yang lolos tetap divalidasi dan dicek warungnya oleh Express.',
  },
  {
    title: 'Simpan ke SQL Server',
    description: 'Data masuk ke review_kantin, lalu respons 201 memicu notifikasi sukses.',
  },
]

export function DashboardPage() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const { menus, stalls, isLoading, isRefreshing, error, reload } = useMenuData()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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

        reload()
      } catch (submitError) {
        if (isApiError(submitError)) {
          if (submitError.code === 'NETWORK_ERROR') {
            showToast({
              tone: 'error',
              message: 'Koneksi ke server terputus.',
              description: 'Pastikan backend dan database SQL Server berjalan.',
            })
          } else if (submitError.status === 401) {
            showToast({
              tone: 'error',
              message: 'Sesi login berakhir.',
              description: 'Silakan masuk kembali untuk menambah menu.',
            })
          } else if (submitError.status === 400 || submitError.status === 404) {
            showToast({
              tone: 'error',
              message: 'Menu ditolak backend.',
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
        message: 'Berhasil keluar dari MaemBolo.',
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

  const status: ApiStatus = isLoading ? 'loading' : error ? 'offline' : 'online'
  const showInitialError = !isLoading && error !== null && menus.length === 0

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        status={status}
        onRefresh={reload}
        isRefreshing={isRefreshing}
        user={user}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-14 pt-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          <div className="border-b border-border bg-surface-muted/70 px-5 py-6 sm:px-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Pertemuan 08 · Hands-on 1
            </span>

            <h1 className="mt-3 max-w-2xl text-2xl font-extrabold text-text sm:text-3xl">
              Form Validation &amp; Basic API Error Handling
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-text-muted">
              Tambah menu kantin lewat form yang memvalidasi input di browser, lalu
              dibuktikan kembali oleh backend Express sebelum disimpan ke SQL Server.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-text-muted">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1">
                <ShieldCheck aria-hidden="true" className="size-3.5 text-success" />
                Validasi dua lapis
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1">
                <CheckCircle2 aria-hidden="true" className="size-3.5 text-success" />
                Fetch API
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1">
                Express 5 + SQL Server
              </span>
            </div>
          </div>

          <ol className="grid gap-4 px-5 py-5 sm:grid-cols-3 sm:px-6">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text">{step.title}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{step.description}</p>
                </div>
                {index < steps.length - 1 ? (
                  <ArrowRight
                    aria-hidden="true"
                    className="mt-1 hidden size-4 shrink-0 text-border sm:block"
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        {showInitialError ? (
          <div className="mt-6">
            <ErrorPanel message={error} onRetry={reload} />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start xl:gap-8">
            <div className="lg:sticky lg:top-24">
              {isLoading ? (
                <LoadingPanel label="Memuat form tambah menu." />
              ) : (
                <MenuForm
                  stalls={stalls}
                  isSubmitting={isSubmitting}
                  onSubmit={handleCreateMenu}
                />
              )}

              {error && menus.length > 0 ? (
                <Alert tone="info" className="mt-4" title="Data mungkin tidak terbaru">
                  {error}
                </Alert>
              ) : null}
            </div>

            <div>
              {isLoading ? <ListSkeleton /> : <MenuList menus={menus} />}
            </div>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  )
}
