export interface MenuItem {
  id: number;
  stallId: number;
  stallName: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface Stall {
  id: number;
  name: string;
  category: string | null;
  location: string | null;
}

export interface MenuPayload {
  stallId: number;
  name: string;
  price: number;
  isAvailable: boolean;
}

export type AvailabilityFilter = 'all' | 'available' | 'unavailable';

export interface ApiEnvelope<T> {
  status: 'success';
  data: T;
  message?: string;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}
