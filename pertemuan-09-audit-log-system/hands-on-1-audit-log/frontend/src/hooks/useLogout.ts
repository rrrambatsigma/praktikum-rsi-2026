import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { isApiError } from '../lib/api'

export function useLogout() {
  const { logout } = useAuth()
  const { clear } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true)

    try {
      await logout()
      clear()
      showToast({
        tone: 'success',
        message: 'Berhasil keluar.',
        description: 'Sesi login Anda sudah ditutup.',
      })
      navigate('/login', { replace: true })
    } catch (error) {
      showToast({
        tone: 'error',
        message: 'Gagal keluar.',
        description: isApiError(error)
          ? error.message
          : 'Terjadi kesalahan yang tidak terduga.',
      })
    } finally {
      setIsLoggingOut(false)
    }
  }, [clear, logout, navigate, showToast])

  return { handleLogout, isLoggingOut }
}
