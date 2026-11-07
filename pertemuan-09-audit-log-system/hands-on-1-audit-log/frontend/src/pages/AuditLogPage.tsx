import { ScrollText } from 'lucide-react'
import { AppFooter } from '../components/AppFooter'
import { AppHeader } from '../components/AppHeader'
import { Alert, Card, PageHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useLogout } from '../hooks/useLogout'

export function AuditLogPage() {
  const { user } = useAuth()
  const { handleLogout, isLoggingOut } = useLogout()

  return (
    <div className="flex min-h-screen flex-col bg-page text-text">
      <AppHeader
        user={user}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader
          eyebrow="Admin"
          title="Riwayat Audit"
          description="Jejak aktivitas login, perubahan menu, pembuatan pesanan, dan perubahan status pesanan. Catatan audit tidak dapat diubah atau dihapus dari aplikasi."
        />

        <Card className="p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary">
              <ScrollText className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="m-0 text-lg font-bold">
                TODO: lengkapi halaman riwayat audit
              </h2>
              <p className="mb-0 mt-1 text-sm leading-relaxed text-text-muted">
                Backend dan fungsi <code>getAuditLogs</code> sudah tersedia. Tugas
                kamu adalah memuat data ke tabel, menyediakan filter aksi/target/
                tanggal, pagination, dan modal detail metadata.
              </p>
            </div>
          </div>
        </Card>

        <div className="mt-4">
          <Alert tone="info" title="Langkah yang disarankan">
            <ol className="m-0 list-decimal space-y-1 pl-5 text-sm">
              <li>
                Panggil <code>getAuditLogs</code> saat halaman dibuka dan saat
                filter berubah.
              </li>
              <li>
                Simpan <code>items</code> dan <code>pagination</code> dari
                respons ke state.
              </li>
              <li>
                Tampilkan tabel: waktu, aksi, target, pengguna, dan ringkasan.
              </li>
              <li>
                Tambahkan tombol detail untuk menampilkan metadata JSON lengkap.
              </li>
              <li>Tangani state loading, kosong, dan error.</li>
            </ol>
          </Alert>
        </div>
      </main>

      <AppFooter user={user} />
    </div>
  )
}
