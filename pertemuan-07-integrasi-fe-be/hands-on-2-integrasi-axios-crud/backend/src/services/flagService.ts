import type { FlagDto } from '../dtos/flagDto.ts';
import { AppError } from '../errors/AppError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { FlagRepository, type FlagRow } from '../repositories/flagRepository.ts';
import { ReviewRepository } from '../repositories/reviewRepository.ts';
import type { CreateFlagInput, FlagQuery, UpdateFlagInput } from '../schemas/flagSchema.ts';
import type { AuthUser } from '../types/user.ts';
import { AuditLogService } from './auditLogService.ts';

export class FlagService {
  private flagRepository: FlagRepository;
  private reviewRepository: ReviewRepository;
  private auditLogService: AuditLogService;

  constructor(
    flagRepository: FlagRepository = new FlagRepository(),
    reviewRepository: ReviewRepository = new ReviewRepository(),
    auditLogService: AuditLogService = new AuditLogService(),
  ) {
    this.flagRepository = flagRepository;
    this.reviewRepository = reviewRepository;
    this.auditLogService = auditLogService;
  }

  private toDto(row: FlagRow): FlagDto {
    return {
      id: row.id,
      reviewId: row.reviewId,
      reportedBy: row.reportedBy,
      reporterName: row.reporterName,
      reviewComment: row.reviewComment,
      stallId: row.stallId,
      stallName: row.stallName,
      reason: row.reason,
      status: row.status,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    };
  }

  async create(reviewId: number, input: CreateFlagInput, user: AuthUser): Promise<FlagDto> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) throw new NotFoundError('Review tidak ditemukan');

    const row = await this.flagRepository.create(reviewId, user.id, input.reason ?? null);
    if (!row) throw new AppError(500, 'Flag gagal dibuat');

    await this.auditLogService.record({
      userId: user.id,
      action: 'CREATE_FLAG',
      targetTable: 'FLAGS',
      targetId: row.id,
      metadata: { reviewId, reason: input.reason ?? null },
    });

    return this.toDto(row);
  }

  async list(params: FlagQuery): Promise<FlagDto[]> {
    const rows = await this.flagRepository.findAll(params.status);
    return rows.map((row) => this.toDto(row));
  }

  async updateStatus(id: number, input: UpdateFlagInput, user: AuthUser): Promise<FlagDto> {
    const current = await this.flagRepository.findById(id);
    if (!current) throw new NotFoundError('Flag tidak ditemukan');

    const row = await this.flagRepository.updateStatus(id, input.status);
    if (!row) throw new NotFoundError('Flag tidak ditemukan');

    await this.auditLogService.record({
      userId: user.id,
      action: 'UPDATE_FLAG_STATUS',
      targetTable: 'FLAGS',
      targetId: row.id,
      metadata: { from: current.status, to: input.status },
    });

    return this.toDto(row);
  }
}
