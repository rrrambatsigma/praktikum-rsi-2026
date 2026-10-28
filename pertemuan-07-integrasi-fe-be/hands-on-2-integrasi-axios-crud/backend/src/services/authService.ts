import bcrypt from 'bcryptjs';
import { env } from '../config/env.ts';
import { ConflictError } from '../errors/ConflictError.ts';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';
import type { UserDto } from '../dtos/userDto.ts';
import { UserRepository, type UserRow } from '../repositories/userRepository.ts';
import type { LoginInput, RegisterInput } from '../schemas/authSchema.ts';
import { AuditLogService } from './auditLogService.ts';
import { signToken } from './tokenService.ts';

export class AuthService {
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

  async register(input: RegisterInput): Promise<UserDto> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('Email sudah terdaftar');

    const passwordHash = await bcrypt.hash(input.password, env.bcryptSaltRounds);
    const row = await this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'customer',
    });

    if (!row) throw new ConflictError('User gagal dibuat');

    await this.auditLogService.record({
      userId: row.id,
      action: 'REGISTER_CUSTOMER',
      targetTable: 'USERS',
      targetId: row.id,
      metadata: { email: row.email },
    });

    return this.toDto(row);
  }

  async login(input: LoginInput): Promise<{ user: UserDto; token: string }> {
    const row = await this.userRepository.findByEmail(input.email);

    if (!row) throw new UnauthorizedError('Email atau password salah');

    let passwordValid = false;
    try {
      passwordValid = await bcrypt.compare(input.password, row.passwordHash);
    } catch {
      passwordValid = false;
    }

    if (!passwordValid) throw new UnauthorizedError('Email atau password salah');

    const user = this.toDto(row);
    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  async me(userId: number): Promise<UserDto> {
    const row = await this.userRepository.findById(userId);
    if (!row) throw new UnauthorizedError();
    return this.toDto(row);
  }
}
