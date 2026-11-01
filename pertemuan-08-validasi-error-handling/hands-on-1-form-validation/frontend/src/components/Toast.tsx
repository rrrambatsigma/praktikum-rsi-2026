import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { useEffect } from 'react'

export interface ToastData {
  id: number
  tone: 'success' | 'error'
  message: string
  description?: string
}

interface ToastProps {
  toast: ToastData
  onClose: () => void
}

const AUTO_DISMISS_MS = 5000

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, AUTO_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [toast.id, onClose])

  const isSuccess = toast.tone === 'success'
  const Icon = isSuccess ? CheckCircle2 : AlertCircle

  return (
    <div
      role={isSuccess ? 'status' : 'alert'}
      aria-live={isSuccess ? 'polite' : 'assertive'}
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm animate-[slide-up_180ms_ease-out] items-start gap-3 rounded-card border border-border bg-surface p-4 shadow-dialog sm:inset-x-auto sm:right-6 sm:mx-0"
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-full ${
          isSuccess ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
        }`}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">
          {isSuccess ? 'Berhasil' : 'Gagal'}
        </p>
        <p className="mt-0.5 text-sm text-text-muted">{toast.message}</p>
        {toast.description ? (
          <p className="mt-1 text-xs text-text-muted">{toast.description}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup notifikasi"
        className="-mr-1 -mt-1 grid size-8 place-items-center rounded-full text-text-muted transition hover:bg-surface-muted hover:text-text"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}
