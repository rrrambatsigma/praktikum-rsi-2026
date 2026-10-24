import type { ReviewDto } from '../dtos/reviewDto.ts';
import { AppError } from '../errors/AppError.ts';
import { ConflictError } from '../errors/ConflictError.ts';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { ReviewRepository, type ReviewRow } from '../repositories/reviewRepository.ts';
import { StallRepository } from '../repositories/stallRepository.ts';
import { FlagRepository } from '../repositories/flagRepository.ts';
import { LikeRepository } from '../repositories/likeRepository.ts';
import type { CreateReviewInput, UpdateReviewInput } from '../schemas/reviewSchema.ts';
import { withTransaction } from '../db/transaction.ts';
import type { AuthUser } from '../types/user.ts';
import { AuditLogService } from './auditLogService.ts';

export class ReviewService {
  private reviewRepository: ReviewRepository;
  private stallRepository: StallRepository;
  private flagRepository: FlagRepository;
  private likeRepository: LikeRepository;
  private auditLogService: AuditLogService;

  constructor(
    reviewRepository: ReviewRepository = new ReviewRepository(),
    stallRepository: StallRepository = new StallRepository(),
    flagRepository: FlagRepository = new FlagRepository(),
    likeRepository: LikeRepository = new LikeRepository(),
    auditLogService: AuditLogService = new AuditLogService(),
  ) {
    this.reviewRepository = reviewRepository;
    this.stallRepository = stallRepository;
    this.flagRepository = flagRepository;
    this.likeRepository = likeRepository;
    this.auditLogService = auditLogService;
  }

  private toDto(row: ReviewRow): ReviewDto {
    return {
      id: row.id,
      stallId: row.stallId,
      stallName: row.stallName,
      userId: row.userId,
      userName: row.userName,
      rating: Number(row.rating),
      comment: row.comment,
      likeCount: Number(row.likeCount),
      likedByMe: Boolean(row.likedByMe),
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    };
  }

  async listByStall(stallId: number, viewerId?: number): Promise<ReviewDto[]> {
    const stall = await this.stallRepository.findById(stallId);
    if (!stall) throw new NotFoundError('Warung tidak ditemukan');

    const rows = await this.reviewRepository.findByStall(stallId, viewerId);
    return rows.map((row) => this.toDto(row));
  }

  async listMine(user: AuthUser): Promise<ReviewDto[]> {
    const rows = await this.reviewRepository.findByUser(user.id);
    return rows.map((row) => this.toDto(row));
  }

  async listManaged(user: AuthUser): Promise<ReviewDto[]> {
    const rows = await this.reviewRepository.findManaged(user.id, user.role);
    return rows.map((row) => this.toDto(row));
  }

  async create(stallId: number, input: CreateReviewInput, user: AuthUser): Promise<ReviewDto> {
    const stall = await this.stallRepository.findById(stallId);
    if (!stall) throw new NotFoundError('Warung tidak ditemukan');

    const existing = await this.reviewRepository.findByStallAndUser(stallId, user.id);
    if (existing) throw new ConflictError('Kamu sudah memberi review untuk warung ini');

    const reviewId = await withTransaction(async (transaction) => {
      const id = await this.reviewRepository.create(
        {
          stallId,
          userId: user.id,
          rating: input.rating,
          comment: input.comment ?? null,
        },
        transaction,
      );

      if (!id) throw new AppError(500, 'Review gagal dibuat');

      await this.reviewRepository.refreshStallSummary(stallId, transaction);
      await this.auditLogService.record(
        {
          userId: user.id,
          action: 'CREATE_REVIEW',
          targetTable: 'REVIEWS',
          targetId: id,
          metadata: { stallId, rating: input.rating },
        },
        transaction,
      );

      return id;
    });

    const row = await this.reviewRepository.findById(reviewId, user.id);
    if (!row) throw new AppError(500, 'Review gagal dibaca kembali');
    return this.toDto(row);
  }

  async update(id: number, input: UpdateReviewInput, user: AuthUser): Promise<ReviewDto> {
    const current = await this.reviewRepository.findById(id, user.id);
    if (!current) throw new NotFoundError('Review tidak ditemukan');

    if (user.role === 'customer' && current.userId !== user.id) {
      throw new ForbiddenError('Kamu hanya bisa mengubah review milikmu');
    }

    if (user.role !== 'customer' && user.role !== 'admin') {
      throw new ForbiddenError('Role ini tidak dapat mengubah review');
    }

    await withTransaction(async (transaction) => {
      const updated = await this.reviewRepository.update(
        id,
        input.rating,
        input.comment ?? null,
        transaction,
      );

      if (!updated) throw new NotFoundError('Review tidak ditemukan');

      await this.reviewRepository.refreshStallSummary(current.stallId, transaction);
      await this.auditLogService.record(
        {
          userId: user.id,
          action: 'UPDATE_REVIEW',
          targetTable: 'REVIEWS',
          targetId: id,
          metadata: { stallId: current.stallId, rating: input.rating },
        },
        transaction,
      );
    });

    const row = await this.reviewRepository.findById(id, user.id);
    if (!row) throw new AppError(500, 'Review gagal dibaca kembali');
    return this.toDto(row);
  }

  async delete(id: number, user: AuthUser): Promise<void> {
    const current = await this.reviewRepository.findById(id, user.id);
    if (!current) throw new NotFoundError('Review tidak ditemukan');

    if (user.role === 'customer') {
      if (current.userId !== user.id) {
        throw new ForbiddenError('Kamu hanya bisa menghapus review milikmu');
      }
    } else if (user.role === 'owner') {
      const stall = await this.stallRepository.findById(current.stallId);
      if (!stall) throw new NotFoundError('Warung tidak ditemukan');
      if (stall.ownerId !== user.id) {
        throw new ForbiddenError('Kamu hanya bisa menghapus review pada warung milikmu');
      }
    } else if (user.role !== 'admin') {
      throw new ForbiddenError('Role ini tidak dapat menghapus review');
    }

    await withTransaction(async (transaction) => {
      await this.flagRepository.removeByReviewId(id, transaction);
      await this.likeRepository.removeByReviewId(id, transaction);

      const removed = await this.reviewRepository.remove(id, transaction);
      if (!removed) throw new NotFoundError('Review tidak ditemukan');

      await this.reviewRepository.refreshStallSummary(current.stallId, transaction);
      await this.auditLogService.record(
        {
          userId: user.id,
          action: 'DELETE_REVIEW',
          targetTable: 'REVIEWS',
          targetId: id,
          metadata: { stallId: current.stallId, rating: current.rating },
        },
        transaction,
      );
    });
  }
}
