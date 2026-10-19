
import { Banknote, CheckCircle2, Utensils } from 'lucide-react'

function Footer() {
  return (
    <footer className="mt-8 border-t border-orange-950/5 bg-[#fcf1e9]">
      <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-5 px-5 py-6 lg:flex-row lg:items-center lg:px-7">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-200 text-green-800">
            <Utensils className="ui-icon" />
          </span>

          <div>
            <p className="font-bold text-stone-900">Maem Bolo</p>
            <p className="text-xs text-stone-600">
              Layanan resmi katalog santapan mahasiswa FATISDA.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-600">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="ui-icon-sm text-green-700" />
            Higienis & Terkurasi
          </span>

          <span className="inline-flex items-center gap-1">
            <Banknote className="ui-icon-sm text-green-700" />
            Harga Ramah Kantong
          </span>

          <span className="text-stone-500">
            © 2026 Kantin Kampus
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
