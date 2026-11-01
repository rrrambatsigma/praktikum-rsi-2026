import { AlertCircle, Info } from 'lucide-react'
import type { ReactNode } from 'react'

type AlertTone = 'error' | 'info'

interface AlertProps {
  tone?: AlertTone
  title?: string
  children: ReactNode
  className?: string
}

const toneStyles: Record<AlertTone, string> = {
  error: 'border-danger/25 bg-danger-bg text-danger',
  info: 'border-primary/20 bg-surface-muted text-text',
}

export function Alert({ tone = 'error', title, children, className = '' }: AlertProps) {
  const Icon = tone === 'error' ? AlertCircle : Info

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-control border px-3.5 py-3 text-sm ${toneStyles[tone]} ${className}`}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="[&_p]:m-0">{children}</div>
      </div>
    </div>
  )
}
