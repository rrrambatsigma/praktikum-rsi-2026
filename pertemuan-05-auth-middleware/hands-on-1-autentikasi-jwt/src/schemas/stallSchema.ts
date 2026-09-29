import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Menambahkan method `.openapi()` ke semua type zod.
// Wajib dipanggil SEBELUM schema memakai `.openapi({ ... })`.
extendZodWithOpenApi(z);

// ------------------------------------------------------------------ params
// id pada /:id selalu coerce dari string query/path menjadi angka.
export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: 'id harus berupa angka' })
    .int('id harus bilangan bulat')
    .positive('id harus lebih dari 0')
    .openapi({ example: 3, description: 'ID warung' }),
});

// ------------------------------------------------------------------- query
// Search & category opsional; page/limit punya default (zod.default = bila absent).
export const stallQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100)
    .optional()
    .openapi({ description: 'Cari berdasarkan nama warung' }),
  category: z
    .string()
    .trim()
    .max(50)
    .optional()
    .openapi({ description: 'Filter kategori warung', example: 'Minuman' }),
  page: z.coerce
    .number({ invalid_type_error: 'page harus berupa angka' })
    .int('page harus bilangan bulat')
    .min(1, 'page minimal 1')
    .default(1)
    .openapi({ description: 'Nomor halaman (default 1)', example: 1 }),
  limit: z.coerce
    .number({ invalid_type_error: 'limit harus berupa angka' })
    .int('limit harus bilangan bulat')
    .min(1, 'limit minimal 1')
    .max(100, 'limit maksimal 100')
    .default(10)
    .openapi({ description: 'Jumlah data per halaman (maks 100)', example: 10 }),
});

// --------------------------------------------------------------- field bantu
const optionalNullableText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

// -------------------------------------------------------------------- body
export const createStallSchema = z
  .object({
    ownerId: z
      .number({ invalid_type_error: 'ownerId harus berupa angka' })
      .int('ownerId harus bilangan bulat')
      .positive('ownerId harus lebih dari 0')
      .openapi({ example: 2, description: 'ID owner (USERS.id dengan role owner)' }),
    name: z
      .string({ required_error: 'name wajib diisi' })
      .trim()
      .min(3, 'name minimal 3 karakter')
      .max(100, 'name maksimal 100 karakter')
      .openapi({ example: 'Warung Baru', description: 'Nama warung' }),
    category: optionalNullableText(50).openapi({
      example: 'Nasi',
      description: 'Kategori warung (mis. Nasi, Bakso, Minuman)',
    }),
    location: optionalNullableText(100).openapi({ example: 'Kantin FK', description: 'Lokasi warung' }),
    description: optionalNullableText(1000).openapi({
      example: 'Nasi goreng dadakan',
      description: 'Deskripsi warung',
    }),
  })
  // .strict() menolak (atau membuang) kunci yang tidak dikenal.
  .strict();

// Semua kolom opsional untuk PUT (update sebagian).
export const updateStallSchema = createStallSchema.partial();

// ------------------------------------------------------------------ types
export type IdParam = z.infer<typeof idParamSchema>;
export type StallQuery = z.infer<typeof stallQuerySchema>;
export type CreateStallInput = z.infer<typeof createStallSchema>;
export type UpdateStallInput = z.infer<typeof updateStallSchema>;