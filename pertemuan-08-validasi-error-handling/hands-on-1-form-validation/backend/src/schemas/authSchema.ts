import { z } from 'zod';
import { ValidationError } from '../errors/ValidationError.ts';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

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

export type LoginInput = z.infer<typeof loginSchema>;

export function parseLoginInput(value: unknown): LoginInput {
  const result = loginSchema.safeParse(value);

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

    throw new ValidationError(details, 'Data login tidak valid.');
  }

  return result.data;
}
