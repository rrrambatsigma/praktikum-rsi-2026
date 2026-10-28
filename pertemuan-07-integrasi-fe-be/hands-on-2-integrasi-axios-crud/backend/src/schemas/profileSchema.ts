import { z } from 'zod';

const emailSchema = z
  .string({ required_error: 'email wajib diisi' })
  .trim()
  .toLowerCase()
  .email('format email tidak valid')
  .max(150, 'email maksimal 150 karakter');

export const updateProfileSchema = z
  .object({
    name: z
      .string({ required_error: 'name wajib diisi' })
      .trim()
      .min(3, 'name minimal 3 karakter')
      .max(100, 'name maksimal 100 karakter')
      .optional(),
    email: emailSchema.optional(),
  })
  .strict('body hanya boleh berisi name dan email')
  .refine((value) => value.name !== undefined || value.email !== undefined, {
    message: 'minimal satu field harus diisi',
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'currentPassword wajib diisi' })
      .min(1, 'currentPassword wajib diisi'),
    newPassword: z
      .string({ required_error: 'newPassword wajib diisi' })
      .min(8, 'password minimal 8 karakter')
      .max(72, 'password maksimal 72 karakter'),
  })
  .strict('body hanya boleh berisi currentPassword dan newPassword');

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
