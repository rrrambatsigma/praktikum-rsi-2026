import bcrypt from 'bcryptjs';
import type { UserDto } from '../dtos/userDto.ts';
import { env } from '../config/env.ts';
import { ConflictError } from '../errors/ConflictError.ts';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { UserRepository, type UserRow } from '../repositories/userRepository.ts';
import type { UserRole } from '../types/user.ts';
import type { CreateOwnerInput, UserQuery } from '../schemas/userSchema.ts';
import { AuditLogService } from './auditLogService.ts';

export class UserService {
  private userRepository: UserRepository;
  private auditLogService: AuditLogService;

  constructor(
    userRepository: UserRepository = new UserRepository(),
    auditLogService: AuditLogService = new AuditLogService(),
  ) {
    this.userRepository = userRepository;
    this.auditLogService = auditLogService;
  }

  private toDto(row: UserRow): UserDto {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    };
  }

  async list(params: UserQuery): Promise<UserDto[]> {
    const rows = await this.userRepository.findAll(params);
    return rows.map((row) => this.toDto(row));
  }

  async createOwner(input: CreateOwnerInput, actorId: number): Promise<UserDto> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('Email sudah terdaftar');

    const passwordHash = await bcrypt.hash(input.password, env.bcryptSaltRounds);
    const row = await this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'owner',
    });

    if (!row) throw new ConflictError('User owner gagal dibuat');

    await this.auditLogService.record({
      userId: actorId,
      action: 'CREATE_OWNER',
      targetTable: 'USERS',
      targetId: row.id,
      metadata: { email: row.email, role: row.role },
    });

    return this.toDto(row);
  }

  async updateRole(id: number, role: UserRole, actorId: number): Promise<UserDto> {
    const target = await this.userRepository.findById(id);
    if (!target) throw new NotFoundError('User tidak ditemukan');

    if (target.id === actorId && role !== 'admin') {
      throw new ForbiddenError('Admin tidak dapat menurunkan role dirinya sendiri');
    }

    if (target.role === 'admin' && role !== 'admin') {
      const adminCount = await this.userRepository.countByRole('admin');
      if (adminCount <= 1) {
        throw new ConflictError('Minimal harus ada satu admin');
      }
    }

    const updated = await this.userRepository.updateRole(id, role);
    if (!updated) throw new NotFoundError('User tidak ditemukan');

    await this.auditLogService.record({
      userId: actorId,
      action: 'UPDATE_USER_ROLE',
      targetTable: 'USERS',
      targetId: updated.id,
      metadata: { from: target.role, to: role },
    });

    return this.toDto(updated);
  }
}
