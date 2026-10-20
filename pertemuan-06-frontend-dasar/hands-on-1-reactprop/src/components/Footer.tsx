import { Banknote, CheckCircle2, Utensils } from 'lucide-react'

function Footer() {
  return (
    <footer className="mt-8 border-t border-border bg-primary-soft">
      <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-5 px-5 py-6 lg:flex-row lg:items-center lg:px-7">
        {/* Identitas Maem Bolo */}
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-available-bg text-available-text">
            <Utensils className="size-[18px] shrink-0" aria-hidden="true" />
          </span>

          <div>
            <p className="font-bold text-text">Maem Bolo</p>
            <p className="text-xs text-muted">
              Layanan resmi katalog santapan mahasiswa FATISDA.
            </p>
          </div>
        </div>

        {/* Informasi layanan */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2
              className="size-[15px] shrink-0 text-success"
              aria-hidden="true"
            />
            Higienis &amp; Terkurasi
          </span>

          <span className="inline-flex items-center gap-1">
            <Banknote
              className="size-[15px] shrink-0 text-success"
              aria-hidden="true"
            />
            Harga Ramah Kantong
          </span>

          <span className="text-muted">
            © 2026 Kantin Kampus
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer