import { z } from 'zod';

export const createFlagSchema = z
  .object({
    reason: z.string().trim().max(255, 'reason maksimal 255 karakter').nullable().optional(),
  })
  .strict('body hanya boleh berisi reason');

export const updateFlagSchema = z
  .object({
    status: z.enum(['resolved', 'dismissed'], {
      invalid_type_error: 'status tidak valid',
    }),
  })
  .strict('body hanya boleh berisi status');

export const flagQuerySchema = z.object({
  status: z.enum(['pending', 'resolved', 'dismissed']).optional(),
});

export type CreateFlagInput = z.infer<typeof createFlagSchema>;
export type UpdateFlagInput = z.infer<typeof updateFlagSchema>;
export type FlagQuery = z.infer<typeof flagQuerySchema>;
