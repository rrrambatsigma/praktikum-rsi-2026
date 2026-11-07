import type { BadgeTone } from '../components/ui'

const actionLabels: Record<string, string> = {
  LOGIN: 'Login',
  CREATE_MENU: 'Tambah menu',
  UPDATE_MENU: 'Ubah menu',
  DELETE_MENU: 'Hapus menu',
  CREATE_ORDER: 'Buat pesanan',
  UPDATE_ORDER_STATUS: 'Ubah status pesanan',
}

const targetLabels: Record<string, string> = {
  USERS: 'Pengguna',
  MENU_ITEMS: 'Menu',
  ORDERS: 'Pesanan',
}

export const auditActionOptions = Object.entries(actionLabels).map(
  ([value, label]) => ({ value, label }),
)

export const auditTargetOptions = Object.entries(targetLabels).map(
  ([value, label]) => ({ value, label }),
)

export function actionLabel(action: string): string {
  return actionLabels[action] ?? action
}

export function targetLabel(targetTable: string): string {
  return targetLabels[targetTable] ?? targetTable
}

export function actionTone(action: string): BadgeTone {
  if (action === 'LOGIN') return 'primary'
  if (action.startsWith('CREATE_')) return 'success'
  if (action.startsWith('UPDATE_')) return 'warning'
  if (action.startsWith('DELETE_')) return 'danger'
  return 'neutral'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function describeMetadata(metadata: unknown): string {
  if (!isRecord(metadata)) return 'Tidak ada detail'

  if (typeof metadata.orderCode === 'string') return metadata.orderCode

  for (const key of ['after', 'before']) {
    const value = metadata[key]

    if (isRecord(value) && typeof value.name === 'string') {
      return value.name
    }
  }

  if (typeof metadata.role === 'string') return `Role: ${metadata.role}`

  if (Array.isArray(metadata.changed)) {
    return metadata.changed.length > 0
      ? `Field: ${metadata.changed.join(', ')}`
      : 'Tidak ada field berubah'
  }

  return 'Lihat detail'
}

export function formatMetadata(metadata: unknown): string {
  if (metadata === null || metadata === undefined) {
    return 'Tidak ada metadata.'
  }

  if (typeof metadata === 'string') return metadata

  try {
    return JSON.stringify(metadata, null, 2)
  } catch {
    return String(metadata)
  }
}
