import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const createStallSchema = z
  .object({
    ownerId: z.coerce
      .number({ invalid_type_error: 'ownerId harus berupa angka' })
      .int('ownerId harus bilangan bulat')
      .positive('ownerId harus lebih dari 0'),
    name: z
      .string({ required_error: 'name wajib diisi' })
      .trim()
      .min(3, 'name minimal 3 karakter')
      .max(100, 'name maksimal 100 karakter'),
    category: optionalText(50),
    location: optionalText(100),
    description: optionalText(1000),
  })
  .strict('body hanya boleh berisi ownerId, name, category, location, dan description');

export const updateStallSchema = z
  .object({
    ownerId: z.coerce.number().int().positive().optional(),
    name: z.string().trim().min(3).max(100).optional(),
    category: optionalText(50),
    location: optionalText(100),
    description: optionalText(1000),
  })
  .strict('body hanya boleh berisi ownerId, name, category, location, dan description')
  .refine((value) => Object.keys(value).length > 0, { message: 'minimal satu field harus diisi' });

export const stallQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(50).optional(),
});

export type CreateStallInput = z.infer<typeof createStallSchema>;
export type UpdateStallInput = z.infer<typeof updateStallSchema>;
export type StallQuery = z.infer<typeof stallQuerySchema>;
