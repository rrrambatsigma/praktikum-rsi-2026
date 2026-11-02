import axios from 'axios'
import { toApiError } from './errors'

const fallbackBaseUrl = 'http://localhost:3002/api'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.trim() || fallbackBaseUrl
).replace(/\/+$/, '')

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    const config = axios.isAxiosError(error) ? error.config : undefined
    const url = config?.url ?? ''
    const isAuthProbe =
      url.includes('/auth/me') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register')

    // Sesi habis saat memakai endpoint terlindungi: beri tahu AuthProvider.
    if (apiError.status === 401 && !isAuthProbe) {
      window.dispatchEvent(new Event('auth:unauthorized'))
    }

    return Promise.reject(apiError)
  },
)
