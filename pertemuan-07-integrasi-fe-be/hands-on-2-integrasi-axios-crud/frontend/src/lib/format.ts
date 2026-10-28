import type { FlagStatus, UserRole } from '../types/api.ts';

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  owner: 'Pemilik Warung',
  customer: 'Pelanggan',
};

const flagStatusLabels: Record<FlagStatus, string> = {
  pending: 'Menunggu',
  resolved: 'Selesai',
  dismissed: 'Diabaikan',
};

const auditActionLabels: Record<string, string> = {
  CHANGE_PASSWORD: 'Mengubah password',
  CREATE_FLAG: 'Melaporkan review',
  CREATE_MENU: 'Menambah menu',
  CREATE_OWNER: 'Membuat akun pemilik',
  CREATE_REVIEW: 'Menulis review',
  CREATE_STALL: 'Menambah warung',
  DELETE_MENU: 'Menghapus menu',
  DELETE_REVIEW: 'Menghapus review',
  DELETE_STALL: 'Menghapus warung',
  REGISTER_CUSTOMER: 'Mendaftar sebagai pelanggan',
  UPDATE_FLAG_STATUS: 'Memperbarui laporan',
  UPDATE_MENU: 'Mengubah menu',
  UPDATE_PROFILE: 'Memperbarui profil',
  UPDATE_REVIEW: 'Mengubah review',
  UPDATE_STALL: 'Mengubah warung',
  UPDATE_USER_ROLE: 'Mengubah peran pengguna',
};

const auditTargetLabels: Record<string, string> = {
  FLAGS: 'Laporan',
  MENU_ITEMS: 'Menu',
  REVIEWS: 'Review',
  STALLS: 'Warung',
  USERS: 'Pengguna',
};

export function formatRole(role: UserRole): string {
  return roleLabels[role];
}

export function formatFlagStatus(status: FlagStatus): string {
  return flagStatusLabels[status];
}

export function formatAuditAction(action: string): string {
  return auditActionLabels[action] ?? 'Aktivitas pengguna';
}

export function formatAuditTarget(target: string): string {
  return auditTargetLabels[target] ?? 'Data';
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | null): string {
  if (!value) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDateOnly(value: string | null): string {
  if (!value) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function formatRating(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
