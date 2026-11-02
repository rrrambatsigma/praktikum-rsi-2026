import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useEffect } from 'react'

export type ToastTone = 'success' | 'error' | 'warning' | 'info'

export interface ToastData {
  id: number
  tone: ToastTone
  message: string
  description?: string
}

interface ToastProps {
  toast: ToastData
  onClose: () => void
}

const AUTO_DISMISS_MS = 5000

const TONE_META = {
  success: {
    icon: CheckCircle2,
    title: 'Berhasil',
    box: 'bg-success-bg text-success',
  },
  error: {
    icon: AlertCircle,
    title: 'Gagal',
    box: 'bg-danger-bg text-danger',
  },
  warning: {
    icon: TriangleAlert,
    title: 'Perhatian',
    box: 'bg-warning-bg text-warning',
  },
  info: {
    icon: Info,
    title: 'Informasi',
    box: 'bg-surface-muted text-primary-dark',
  },
} satisfies Record<ToastTone, { icon: typeof CheckCircle2; title: string; box: string }>

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, AUTO_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [toast.id, onClose])

  const meta = TONE_META[toast.tone]
  const Icon = meta.icon
  const isUrgent = toast.tone === 'error' || toast.tone === 'warning'

  return (
    <div
      role={isUrgent ? 'alert' : 'status'}
      aria-live={isUrgent ? 'assertive' : 'polite'}
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm animate-[slide-up_180ms_ease-out] items-start gap-3 rounded-card border border-border bg-surface p-4 shadow-dialog sm:inset-x-auto sm:right-6 sm:mx-0"
    >
      <span className={`grid size-9 shrink-0 place-items-center rounded-full ${meta.box}`}>
        <Icon aria-hidden="true" className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">{meta.title}</p>
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
