import { z } from 'zod';
import type { MenuCategory } from '../dtos/menuDto.ts';
import { ValidationError } from '../errors/ValidationError.ts';

export const menuInputSchema = z
  .object({
    stallId: z
      .number({
        required_error: 'Warung wajib dipilih.',
        invalid_type_error: 'Warung tidak valid.',
      })
      .int('Warung tidak valid.')
      .positive('Warung wajib dipilih.'),
    name: z
      .string({
        required_error: 'Nama menu wajib diisi.',
        invalid_type_error: 'Nama menu harus berupa teks.',
      })
      .trim()
      .min(2, 'Nama menu minimal 2 karakter.')
      .max(100, 'Nama menu maksimal 100 karakter.'),
    category: z.enum(['makanan', 'minuman', 'camilan'], {
      required_error: 'Kategori menu wajib dipilih.',
      invalid_type_error: 'Kategori menu tidak valid.',
    }),
    price: z
      .number({
        required_error: 'Harga wajib diisi.',
        invalid_type_error: 'Harga harus berupa angka.',
      })
      .int('Harga harus berupa bilangan bulat.')
      .positive('Harga harus lebih dari 0.')
      .max(1_000_000, 'Harga maksimal Rp1.000.000.'),
    description: z
      .string({
        invalid_type_error: 'Deskripsi harus berupa teks.',
      })
      .trim()
      .max(255, 'Deskripsi maksimal 255 karakter.')
      .optional()
      .default(''),
    isAvailable: z
      .boolean({
        invalid_type_error: 'Status ketersediaan harus berupa boolean.',
      })
      .default(true),
  })
  .strict(
    'Body hanya boleh berisi stallId, name, category, price, description, dan isAvailable.',
  );

export interface CreateMenuInput {
  stallId: number;
  name: string;
  category: MenuCategory;
  price: number;
  description: string;
  isAvailable: boolean;
}

export function parseCreateMenuInput(value: unknown): CreateMenuInput {
  const result = menuInputSchema.safeParse(value);

  if (!result.success) {
    const details = result.error.issues.map((issue) => {
      if (issue.code === 'unrecognized_keys') {
        return {
          field: 'body',
          message: `Field tidak dikenal: ${issue.keys.join(', ')}.`,
        };
      }

      return {
        field: issue.path.length > 0 ? String(issue.path[0]) : 'body',
        message: issue.message,
      };
    });

    throw new ValidationError(details);
  }

  return result.data;
}
