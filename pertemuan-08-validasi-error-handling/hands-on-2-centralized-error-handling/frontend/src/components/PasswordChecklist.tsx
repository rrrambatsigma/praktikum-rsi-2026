import { Check, X } from 'lucide-react'
import { passwordChecks } from '../lib/validation'

export function PasswordChecklist({ password }: { password: string }) {
  const checks = passwordChecks(password)

  return (
    <ul className="mt-2 grid gap-1 sm:grid-cols-2" aria-label="Syarat password">
      {checks.map((check) => (
        <li
          key={check.label}
          className={`flex items-center gap-1.5 text-[11px] ${
            check.valid ? 'text-success' : 'text-text-muted'
          }`}
        >
          <span
            className={`grid size-4 shrink-0 place-items-center rounded-full ${
              check.valid ? 'bg-success-bg text-success' : 'bg-surface-muted text-text-muted'
            }`}
          >
            {check.valid ? (
              <Check className="size-3" aria-hidden="true" />
            ) : (
              <X className="size-3" aria-hidden="true" />
            )}
          </span>
          {check.label}
        </li>
      ))}
    </ul>
  )
}
