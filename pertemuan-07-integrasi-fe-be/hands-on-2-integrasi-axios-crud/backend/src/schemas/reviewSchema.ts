import { z } from 'zod';

const ratingSchema = z.coerce
  .number({ invalid_type_error: 'rating harus berupa angka' })
  .int('rating harus bilangan bulat')
  .min(1, 'rating minimal 1')
  .max(5, 'rating maksimal 5');

const commentSchema = z
  .string()
  .trim()
  .max(1000, 'comment maksimal 1000 karakter')
  .nullable()
  .optional();

export const createReviewSchema = z
  .object({
    rating: ratingSchema,
    comment: commentSchema,
  })
  .strict('body hanya boleh berisi rating dan comment');

export const updateReviewSchema = z
  .object({
    rating: ratingSchema,
    comment: commentSchema,
  })
  .strict('body hanya boleh berisi rating dan comment');

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
