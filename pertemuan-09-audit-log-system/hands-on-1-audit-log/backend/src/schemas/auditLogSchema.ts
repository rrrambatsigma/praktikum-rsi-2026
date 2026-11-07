import { z } from 'zod';
import { ValidationError } from '../errors/ValidationError.ts';

const dateOnly = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Gunakan format tanggal YYYY-MM-DD.')
  .refine(
    (value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()),
    'Tanggal tidak valid.',
  );

export const auditLogQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    action: z.string().trim().max(50).optional(),
    targetTable: z.string().trim().max(50).optional(),
    from: dateOnly.optional(),
    to: dateOnly.optional(),
  })
  .strict()
  .refine(
    (value) => !value.from || !value.to || value.from <= value.to,
    {
      message: 'Tanggal awal tidak boleh melewati tanggal akhir.',
      path: ['from'],
    },
  );

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

/** Dipakai controller karena `req.query` di Express 5 bersifat read-only. */
export function parseAuditLogQuery(raw: unknown): AuditLogQuery {
  const result = auditLogQuerySchema.safeParse(raw);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.length > 0 ? String(issue.path[0]) : 'query',
      message: issue.message,
    }));

    throw new ValidationError(details, 'Parameter filter audit tidak valid.');
  }

  return result.data;
}
