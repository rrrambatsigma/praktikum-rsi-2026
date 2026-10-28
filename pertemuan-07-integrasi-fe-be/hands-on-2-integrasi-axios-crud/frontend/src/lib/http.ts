import axios from 'axios';
import type { ApiErrorBody } from '../types/api.ts';

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000/api';

export const http = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// TODO: tambahkan response interceptor untuk menangani 401.
// Saat menerima 401 dari endpoint selain /auth/me, /auth/login, dan
// /auth/register, kirim event "auth:unauthorized".

const fieldLabels: Record<string, string> = {
  name: 'Nama',
  email: 'Email',
  password: 'Password',
  currentPassword: 'Password lama',
  newPassword: 'Password baru',
  role: 'Peran',
  ownerId: 'Pemilik warung',
  stallId: 'Warung',
  menuId: 'Menu',
  price: 'Harga',
  isAvailable: 'Ketersediaan menu',
  rating: 'Rating',
  comment: 'Komentar',
  reason: 'Alasan',
  status: 'Status',
  search: 'Pencarian',
  category: 'Kategori',
  location: 'Lokasi',
  description: 'Deskripsi',
};

function fieldLabel(field: string): string {
  if (fieldLabels[field]) return fieldLabels[field];

  const spaced = field.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function validationMessage(details: ApiErrorBody['errors']): string | null {
  if (!details || details.length === 0) return null;

  return details.map((item) => `${fieldLabel(item.field)}: ${item.message}`).join(' ');
}

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return 'Terjadi kesalahan. Coba lagi.';
  }

  const status = error.response?.status;
  const body = error.response?.data;
  const url = error.config?.url ?? '';

  if (status === 400) {
    return (
      validationMessage(body?.errors) ??
      (typeof body?.message === 'string' && body.message.trim() !== ''
        ? body.message
        : 'Data yang dikirim belum lengkap atau tidak valid.')
    );
  }

  if (status === 401) {
    if (url.endsWith('/auth/login')) {
      return 'Email atau password tidak cocok.';
    }

    return 'Sesi kamu sudah berakhir. Silakan masuk kembali.';
  }

  if (status === 403) {
    return 'Kamu tidak memiliki akses untuk melakukan tindakan ini.';
  }

  if (status === 404) {
    return 'Data yang kamu cari tidak ditemukan.';
  }

  if (status === 409) {
    return typeof body?.message === 'string' && body.message.trim() !== ''
      ? body.message
      : 'Data ini sudah ada.';
  }

  if (status === 429) {
    return 'Terlalu banyak percobaan. Coba lagi sebentar.';
  }

  if (status && status >= 500) {
    return 'Terjadi masalah pada server. Coba lagi beberapa saat.';
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'Permintaan memakan waktu terlalu lama. Coba lagi.';
  }

  if (!error.response) {
    return 'Tidak dapat terhubung ke server. Periksa koneksimu lalu coba lagi.';
  }

  return 'Terjadi kesalahan. Coba lagi.';
}
