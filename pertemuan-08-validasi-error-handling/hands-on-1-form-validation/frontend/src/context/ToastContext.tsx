/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { Toast, type ToastData } from '../components/Toast'

interface ToastContextValue {
  showToast: (input: Omit<ToastData, 'id'>) => void
  dismissToast: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/**
 * Satu provider toast untuk seluruh aplikasi.
 * Karena hanya satu toast yang disimpan, satu operasi tidak mungkin
 * memunculkan dua notifikasi identik sekaligus.
 */
export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastData | null>(null)

  const dismissToast = useCallback(() => setToast(null), [])

  const showToast = useCallback((input: Omit<ToastData, 'id'>) => {
    setToast({ ...input, id: Date.now() + Math.random() })
  }, [])

  const value = useMemo(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <Toast toast={toast} onClose={dismissToast} /> : null}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast harus dipakai di dalam ToastProvider.')
  }

  return context
}
