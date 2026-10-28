import type {
  ApiEnvelope,
  ApiErrorDetail,
  MenuItem,
  MenuPayload,
  Stall,
} from '../types/menu';

const fallbackBaseUrl = 'http://localhost:3000/api';
const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE_URL = (envBaseUrl || fallbackBaseUrl).replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly details: ApiErrorDetail[];

  constructor(message: string, status: number, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isErrorDetail(value: unknown): value is ApiErrorDetail {
  return (
    isRecord(value) &&
    typeof value.field === 'string' &&
    typeof value.message === 'string'
  );
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  headers.set('Accept', 'application/json');

  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(
      'Tidak dapat terhubung ke server. Pastikan backend berjalan.',
      0,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const rawBody = await response.text();
  let payload: unknown = null;

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const failure = isRecord(payload) ? payload : {};
    const message =
      typeof failure.message === 'string'
        ? failure.message
        : `Permintaan gagal dengan status ${response.status}`;
    const details = Array.isArray(failure.errors)
      ? failure.errors.filter(isErrorDetail)
      : [];

    throw new ApiError(message, response.status, details);
  }

  if (!isRecord(payload) || !('data' in payload)) {
    throw new ApiError('Respons server tidak memiliki format yang valid.', response.status);
  }

  return (payload as unknown as ApiEnvelope<T>).data;
}

export function getMenus(): Promise<MenuItem[]> {
  return request<MenuItem[]>('/menu');
}

export function getMenuById(id: number): Promise<MenuItem> {
  return request<MenuItem>(`/menu/${id}`);
}

export function getStalls(): Promise<Stall[]> {
  return request<Stall[]>('/stalls');
}

export function createMenu(payload: MenuPayload): Promise<MenuItem> {
  return request<MenuItem>('/menu', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMenu(id: number, payload: MenuPayload): Promise<MenuItem> {
  return request<MenuItem>(`/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteMenu(id: number): Promise<void> {
  return request<void>(`/menu/${id}`, {
    method: 'DELETE',
  });
}
