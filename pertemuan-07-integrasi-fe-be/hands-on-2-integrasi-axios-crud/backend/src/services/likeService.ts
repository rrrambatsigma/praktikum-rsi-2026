import { AppError } from '../errors/AppError.ts';
import { ConflictError } from '../errors/ConflictError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { LikeRepository } from '../repositories/likeRepository.ts';
import { ReviewRepository } from '../repositories/reviewRepository.ts';
import { withTransaction } from '../db/transaction.ts';

export interface LikeState {
  reviewId: number;
  liked: boolean;
  likeCount: number;
}

export class LikeService {
  private likeRepository: LikeRepository;
  private reviewRepository: ReviewRepository;

  constructor(
    likeRepository: LikeRepository = new LikeRepository(),
    reviewRepository: ReviewRepository = new ReviewRepository(),
  ) {
    this.likeRepository = likeRepository;
    this.reviewRepository = reviewRepository;
  }

  async like(reviewId: number, userId: number): Promise<LikeState> {
    const review = await this.reviewRepository.findById(reviewId, userId);
    if (!review) throw new NotFoundError('Review tidak ditemukan');

    const existing = await this.likeRepository.findByReviewAndUser(reviewId, userId);
    if (existing) throw new ConflictError('Kamu sudah menyukai review ini');

    const likeCount = await withTransaction(async (transaction) => {
      const created = await this.likeRepository.create(reviewId, userId, transaction);
      if (!created) throw new AppError(500, 'Like gagal dibuat');
      return this.likeRepository.refreshReviewLikeCount(reviewId, transaction);
    });

    return { reviewId, liked: true, likeCount };
  }

  async unlike(reviewId: number, userId: number): Promise<LikeState> {
    const review = await this.reviewRepository.findById(reviewId, userId);
    if (!review) throw new NotFoundError('Review tidak ditemukan');

    const likeCount = await withTransaction(async (transaction) => {
      await this.likeRepository.remove(reviewId, userId, transaction);
      return this.likeRepository.refreshReviewLikeCount(reviewId, transaction);
    });

    return { reviewId, liked: false, likeCount };
  }
}
