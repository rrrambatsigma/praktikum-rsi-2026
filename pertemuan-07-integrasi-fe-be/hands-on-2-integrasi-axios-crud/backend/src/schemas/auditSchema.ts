import { z } from 'zod';

export const auditQuerySchema = z.object({
  action: z.string().trim().max(50).optional(),
  targetTable: z.string().trim().max(50).optional(),
});

export type AuditQuery = z.infer<typeof auditQuerySchema>;
