import { z } from 'zod';

// ------------------------------------------------------------------- fields
// bcrypt hanya memproses 72 byte pertama, jadi password dibatasi di situ.
const passwordSchema = z
  .string({ required_error: 'password wajib diisi' })
  .min(8, 'password minimal 8 karakter')
  .max(72, 'password maksimal 72 karakter');

const emailSchema = z
  .string({ required_error: 'email wajib diisi' })
  .trim()
  .toLowerCase()
  .email('format email tidak valid')
  .max(150, 'email maksimal 150 karakter');

// -------------------------------------------------------------------- body
// CATATAN: schema ini SENGAJA tidak punya field `role`.
// Role diberikan server saat register (selalu 'customer'). Kalau `role`
// diterima dari body, siapa pun bisa mendaftarkan diri sebagai admin.
export const registerSchema = z
  .object({
    name: z
      .string({ required_error: 'name wajib diisi' })
      .trim()
      .min(3, 'name minimal 3 karakter')
      .max(100, 'name maksimal 100 karakter'),
    email: emailSchema,
    password: passwordSchema,
  })
  // .strict() menolak kunci tak dikenal, termasuk percobaan mengirim `role`.
  // zod v3 menerima pesan kustom di sini, jadi pesan default-nya yang bahasa
  // Inggris bisa diganti agar konsisten dengan pesan validasi yang lain.
  .strict({ message: 'body hanya boleh berisi name, email, dan password' });

export const loginSchema = z
  .object({
    email: emailSchema,
    // Di login cukup dicek tidak kosong; aturan panjang hanya berlaku saat register.
    password: z.string({ required_error: 'password wajib diisi' }).min(1, 'password wajib diisi'),
  })
  .strict({ message: 'body hanya boleh berisi email dan password' });

// ------------------------------------------------------------------ types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;