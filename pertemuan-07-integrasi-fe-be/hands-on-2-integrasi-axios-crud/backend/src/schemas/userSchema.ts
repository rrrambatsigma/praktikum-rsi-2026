import { z } from 'zod';

const roleSchema = z.enum(['admin', 'owner', 'customer'], {
  invalid_type_error: 'role tidak valid',
});

export const createOwnerSchema = z
  .object({
    name: z
      .string({ required_error: 'name wajib diisi' })
      .trim()
      .min(3, 'name minimal 3 karakter')
      .max(100, 'name maksimal 100 karakter'),
    email: z
      .string({ required_error: 'email wajib diisi' })
      .trim()
      .toLowerCase()
      .email('format email tidak valid')
      .max(150, 'email maksimal 150 karakter'),
    password: z
      .string({ required_error: 'password wajib diisi' })
      .min(8, 'password minimal 8 karakter')
      .max(72, 'password maksimal 72 karakter'),
  })
  .strict('body hanya boleh berisi name, email, dan password');

export const updateRoleSchema = z
  .object({
    role: roleSchema,
  })
  .strict('body hanya boleh berisi role');

export const userQuerySchema = z.object({
  role: roleSchema.optional(),
  search: z.string().trim().max(100).optional(),
});

export type CreateOwnerInput = z.infer<typeof createOwnerSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
