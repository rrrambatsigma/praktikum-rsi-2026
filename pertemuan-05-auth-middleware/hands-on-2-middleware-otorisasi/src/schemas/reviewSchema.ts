import { z } from 'zod';

/**
 * Body untuk membuat review.
 *
 * `userId` SENGAJA tidak ada di sini. Identitas selalu diambil dari
 * `req.user` — kalau berasal dari body, siapa pun bisa menulis review
 * seolah-olah dia orang lain.
 */
export const createReviewSchema = z
  .object({
    rating: z.coerce
      .number({ invalid_type_error: 'rating harus berupa angka' })
      .int('rating harus bilangan bulat')
      .min(1, 'rating minimal 1')
      .max(5, 'rating maksimal 5')
      .openapi({ example: 4, description: 'Rating 1 sampai 5' }),
    comment: z
      .string()
      .trim()
      .max(1000, 'comment maksimal 1000 karakter')
      .nullable()
      .optional()
      .openapi({ example: 'Kwetiaunya enak banget!', description: 'Komentar opsional' }),
  })
  .strict({ message: 'body hanya boleh berisi rating dan comment' });

export type CreateReviewInput = z.infer<typeof createReviewSchema>;