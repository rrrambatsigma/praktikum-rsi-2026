import type { MenuPayload } from '../types/menu';

export interface MenuFormValues {
  stallId: string;
  name: string;
  price: string;
  isAvailable: boolean;
}

export type MenuFormErrors = Partial<Record<'stallId' | 'name' | 'price', string>>;

export function validateMenuForm(values: MenuFormValues): MenuFormErrors {
  const errors: MenuFormErrors = {};
  const stallId = Number(values.stallId);
  const name = values.name.trim();
  const price = Number(values.price);

  if (!Number.isInteger(stallId) || stallId <= 0) {
    errors.stallId = 'Pilih warung terlebih dahulu.';
  }

  if (name.length < 2) {
    errors.name = 'Nama menu minimal 2 karakter.';
  } else if (name.length > 100) {
    errors.name = 'Nama menu maksimal 100 karakter.';
  }

  if (!values.price.trim()) {
    errors.price = 'Harga wajib diisi.';
  } else if (!Number.isInteger(price) || price < 0) {
    errors.price = 'Harga harus berupa bilangan bulat minimal 0.';
  } else if (price > 1_000_000_000) {
    errors.price = 'Harga maksimal Rp1.000.000.000.';
  }

  return errors;
}

export function toMenuPayload(values: MenuFormValues): MenuPayload {
  return {
    stallId: Number(values.stallId),
    name: values.name.trim(),
    price: Number(values.price),
    isAvailable: values.isAvailable,
  };
}
