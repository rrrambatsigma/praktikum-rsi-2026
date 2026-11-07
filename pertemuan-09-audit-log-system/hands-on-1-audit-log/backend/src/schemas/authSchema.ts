import { z } from 'zod';
import { ValidationError } from '../errors/ValidationError.ts';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;

const emailSchema = z
  .string({
    required_error: 'Email wajib diisi.',
    invalid_type_error: 'Email harus berupa teks.',
  })
  .trim()
  .toLowerCase()
  .min(1, 'Email wajib diisi.')
  .email('Format email tidak valid.')
  .max(150, 'Email maksimal 150 karakter.');

const passwordSchema = z
  .string({
    required_error: 'Password wajib diisi.',
    invalid_type_error: 'Password harus berupa teks.',
  })
  .min(1, 'Password wajib diisi.')
  .min(PASSWORD_MIN_LENGTH, `Password minimal ${PASSWORD_MIN_LENGTH} karakter.`)
  .max(PASSWORD_MAX_LENGTH, `Password maksimal ${PASSWORD_MAX_LENGTH} karakter.`);

export const loginSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict('Body hanya boleh berisi email dan password.');

export const registerSchema = z
  .object({
    name: z
      .string({
        required_error: 'Nama wajib diisi.',
        invalid_type_error: 'Nama harus berupa teks.',
      })
      .trim()
      .min(1, 'Nama wajib diisi.')
      .min(NAME_MIN_LENGTH, `Nama minimal ${NAME_MIN_LENGTH} karakter.`)
      .max(NAME_MAX_LENGTH, `Nama maksimal ${NAME_MAX_LENGTH} karakter.`),
    email: emailSchema,
    password: passwordSchema
      .regex(/[A-Za-z]/, 'Password harus mengandung huruf.')
      .regex(/[0-9]/, 'Password harus mengandung angka.'),
    confirmPassword: z
      .string({
        required_error: 'Konfirmasi password wajib diisi.',
        invalid_type_error: 'Konfirmasi password harus berupa teks.',
      })
      .min(1, 'Konfirmasi password wajib diisi.'),
  })
  .strict('Body hanya boleh berisi name, email, password, dan confirmPassword.')
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Konfirmasi password tidak sama.',
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

function toDetails(error: z.ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => {
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
}

export function parseLoginInput(value: unknown): LoginInput {
  const result = loginSchema.safeParse(value);

  if (!result.success) {
    throw new ValidationError(toDetails(result.error), 'Data login tidak valid.');
  }

  return result.data;
}

export function parseRegisterInput(value: unknown): RegisterInput {
  const result = registerSchema.safeParse(value);

  if (!result.success) {
    throw new ValidationError(toDetails(result.error), 'Data pendaftaran tidak valid.');
  }

  return result.data;
}
