import { z } from 'zod';

export const menuInputSchema = z
  .object({
    stallId: z.coerce
      .number({ invalid_type_error: 'stallId harus berupa angka' })
      .int('stallId harus bilangan bulat')
      .positive('stallId harus lebih dari 0'),
    name: z
      .string({ required_error: 'name wajib diisi' })
      .trim()
      .min(2, 'name minimal 2 karakter')
      .max(100, 'name maksimal 100 karakter'),
    price: z.coerce
      .number({ invalid_type_error: 'price harus berupa angka' })
      .int('price harus bilangan bulat')
      .min(0, 'price minimal 0'),
    isAvailable: z.boolean().default(true),
  })
  .strict('body hanya boleh berisi stallId, name, price, dan isAvailable');

export const menuQuerySchema = z.object({
  stallId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().max(100).optional(),
  available: z.enum(['true', 'false']).optional(),
});

export type MenuInput = z.infer<typeof menuInputSchema>;
export type MenuQuery = z.infer<typeof menuQuerySchema>;
