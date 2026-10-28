import type { StallDto } from '../dtos/stallDto.ts';
import { AppError } from '../errors/AppError.ts';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { StallRepository, type StallRow } from '../repositories/stallRepository.ts';
import { UserRepository } from '../repositories/userRepository.ts';
import type { CreateStallInput, StallQuery, UpdateStallInput } from '../schemas/stallSchema.ts';
import { withTransaction } from '../db/transaction.ts';
import type { AuthUser } from '../types/user.ts';
import { AuditLogService } from './auditLogService.ts';

export class StallService {
  private stallRepository: StallRepository;
  private userRepository: UserRepository;
  private auditLogService: AuditLogService;

  constructor(
    stallRepository: StallRepository = new StallRepository(),
    userRepository: UserRepository = new UserRepository(),
    auditLogService: AuditLogService = new AuditLogService(),
  ) {
    this.stallRepository = stallRepository;
    this.userRepository = userRepository;
    this.auditLogService = auditLogService;
  }

  private toDto(row: StallRow): StallDto {
    const avgRating = Number(row.avgRating);
    return {
      id: row.id,
      ownerId: row.ownerId,
      ownerName: row.ownerName,
      name: row.name,
      category: row.category,
      location: row.location,
      description: row.description,
      avgRating,
      reviewCount: Number(row.reviewCount),
      isPopular: avgRating >= 4.7,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    };
  }

  private async ensureOwner(ownerId: number): Promise<void> {
    const owner = await this.userRepository.findById(ownerId);
    if (!owner) throw new NotFoundError('Owner tidak ditemukan');
    if (owner.role !== 'owner') {
      throw new AppError(400, 'ownerId harus merujuk ke user dengan role owner');
    }
  }

  async list(params: StallQuery): Promise<StallDto[]> {
    const rows = await this.stallRepository.findAll(params);
    return rows.map((row) => this.toDto(row));
  }

  async get(id: number): Promise<StallDto> {
    const row = await this.stallRepository.findById(id);
    if (!row) throw new NotFoundError('Warung tidak ditemukan');
    return this.toDto(row);
  }

  async create(input: CreateStallInput, actorId: number): Promise<StallDto> {
    await this.ensureOwner(input.ownerId);

    const row = await this.stallRepository.create({
      ownerId: input.ownerId,
      name: input.name,
      category: input.category ?? null,
      location: input.location ?? null,
      description: input.description ?? null,
    });

    if (!row) throw new AppError(500, 'Warung gagal dibuat');

    await this.auditLogService.record({
      userId: actorId,
      action: 'CREATE_STALL',
      targetTable: 'STALLS',
      targetId: row.id,
      metadata: { name: row.name, ownerId: row.ownerId },
    });

    return this.toDto(row);
  }

  async update(id: number, input: UpdateStallInput, user: AuthUser): Promise<StallDto> {
    const current = await this.stallRepository.findById(id);
    if (!current) throw new NotFoundError('Warung tidak ditemukan');

    if (user.role !== 'admin') {
      if (current.ownerId !== user.id) {
        throw new ForbiddenError('Kamu hanya bisa mengubah warung milikmu sendiri');
      }

      if (input.ownerId !== undefined) {
        throw new ForbiddenError('Hanya admin yang dapat memindahkan pemilik warung');
      }
    } else if (input.ownerId !== undefined) {
      await this.ensureOwner(input.ownerId);
    }

    const row = await this.stallRepository.update({
      id,
      ownerId: input.ownerId ?? current.ownerId,
      name: input.name ?? current.name,
      category: input.category !== undefined ? input.category : current.category,
      location: input.location !== undefined ? input.location : current.location,
      description: input.description !== undefined ? input.description : current.description,
    });

    if (!row) throw new NotFoundError('Warung tidak ditemukan');

    await this.auditLogService.record({
      userId: user.id,
      action: 'UPDATE_STALL',
      targetTable: 'STALLS',
      targetId: row.id,
      metadata: { name: row.name },
    });

    return this.toDto(row);
  }

  async delete(id: number, user: AuthUser): Promise<void> {
    const current = await this.stallRepository.findById(id);
    if (!current) throw new NotFoundError('Warung tidak ditemukan');

    if (user.role !== 'admin' && current.ownerId !== user.id) {
      throw new ForbiddenError('Kamu hanya bisa menghapus warung milikmu sendiri');
    }

    await withTransaction(async (transaction) => {
      const removed = await this.stallRepository.remove(id, transaction);
      if (!removed) throw new NotFoundError('Warung tidak ditemukan');

      await this.auditLogService.record(
        {
          userId: user.id,
          action: 'DELETE_STALL',
          targetTable: 'STALLS',
          targetId: id,
          metadata: { name: current.name, ownerId: current.ownerId },
        },
        transaction,
      );
    });
  }
}
