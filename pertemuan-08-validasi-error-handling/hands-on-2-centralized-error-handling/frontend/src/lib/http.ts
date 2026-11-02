import axios from 'axios'

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

// TODO: tambahkan response interceptor untuk menangani 401.
// Saat menerima 401 dari endpoint selain /auth/me, /auth/login, dan
// /auth/register, kirim event "auth:unauthorized".
