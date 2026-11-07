/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../lib/api'
import type { LoginPayload, RegisterPayload, User } from '../types/auth'

interface AuthContextValue {
  user: User | null
  isReady: boolean
  login: (input: LoginPayload) => Promise<User>
  register: (input: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Sesi disimpan di cookie httpOnly yang dikelola backend.
 * Frontend hanya menyimpan data user di memori; tidak ada token di localStorage.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let active = true

    const handleUnauthorized = () => {
      if (active) setUser(null)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)

    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch(() => {
        // 401 berarti belum login; error jaringan juga membuat dashboard
        // tertutup sampai sesi benar-benar bisa diverifikasi.
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setIsReady(true)
      })

    return () => {
      active = false
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [])

  const login = useCallback(async (input: LoginPayload) => {
    const loggedInUser = await loginRequest(input)
    setUser(loggedInUser)
    return loggedInUser
  }, [])

  const register = useCallback(async (input: RegisterPayload) => {
    // Backend sengaja tidak membuat sesi saat register. User harus login
    // supaya toast pendaftaran dan toast login terpisah.
    const created = await registerRequest(input)
    return created.data
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isReady, login, register, logout }),
    [user, isReady, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider.')
  }

  return context
}
