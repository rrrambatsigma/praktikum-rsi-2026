import bcrypt from 'bcryptjs';
import { env } from '../config/env.ts';
import { AppError } from '../errors/AppError.ts';
import { ConflictError } from '../errors/ConflictError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';
import type { UserDto } from '../dtos/userDto.ts';
import { UserRepository, type UserRow } from '../repositories/userRepository.ts';
import type { ChangePasswordInput, UpdateProfileInput } from '../schemas/profileSchema.ts';
import { AuditLogService } from './auditLogService.ts';

export class ProfileService {
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

  async get(userId: number): Promise<UserDto> {
    const row = await this.userRepository.findById(userId);
    if (!row) throw new UnauthorizedError();
    return this.toDto(row);
  }

  async update(userId: number, input: UpdateProfileInput): Promise<UserDto> {
    const current = await this.userRepository.findById(userId);
    if (!current) throw new UnauthorizedError();

    const nextEmail = input.email ?? current.email;

    if (nextEmail !== current.email) {
      const existing = await this.userRepository.findByEmail(nextEmail);
      if (existing && existing.id !== userId) {
        throw new ConflictError('Email sudah terdaftar');
      }
    }

    const updated = await this.userRepository.updateProfile(
      userId,
      input.name ?? current.name,
      nextEmail,
    );

    if (!updated) throw new NotFoundError('User tidak ditemukan');

    await this.auditLogService.record({
      userId,
      action: 'UPDATE_PROFILE',
      targetTable: 'USERS',
      targetId: userId,
      metadata: { email: updated.email },
    });

    return this.toDto(updated);
  }

  async changePassword(userId: number, input: ChangePasswordInput): Promise<void> {
    const current = await this.userRepository.findById(userId);
    if (!current) throw new UnauthorizedError();

    let valid = false;
    try {
      valid = await bcrypt.compare(input.currentPassword, current.passwordHash);
    } catch {
      valid = false;
    }

    if (!valid) throw new AppError(400, 'Password lama tidak sesuai');

    const passwordHash = await bcrypt.hash(input.newPassword, env.bcryptSaltRounds);
    const updated = await this.userRepository.updatePassword(userId, passwordHash);

    if (!updated) throw new NotFoundError('User tidak ditemukan');

    await this.auditLogService.record({
      userId,
      action: 'CHANGE_PASSWORD',
      targetTable: 'USERS',
      targetId: userId,
    });
  }
}
