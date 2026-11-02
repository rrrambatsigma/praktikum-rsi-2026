interface FieldErrorProps {
  id: string
  message?: string
}

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null

  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs text-danger">
      <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-danger" />
      <span>{message}</span>
    </p>
  )
}
