import bcrypt from 'bcryptjs';
import { env } from '../config/env.ts';
import type { AuthUserDto } from '../dtos/authDto.ts';
import { ConflictError } from '../errors/ConflictError.ts';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';
import { UserRepository, type UserRow } from '../repositories/userRepository.ts';
import type { LoginInput, RegisterInput } from '../schemas/authSchema.ts';
import { signToken } from './tokenService.ts';

function isUniqueViolation(error: unknown): boolean {
  const dbError = error as { number?: number };
  return dbError.number === 2627 || dbError.number === 2601;
}

export class AuthService {
  constructor(private readonly userRepository: UserRepository = new UserRepository()) {}

  private toDto(row: UserRow): AuthUserDto {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
    };
  }

  /**
   * Login memeriksa kredensial sebenarnya dengan bcrypt.compare.
   * Email tidak dikenal dan password salah sengaja memakai pesan yang sama,
   * supaya penyerang tidak bisa menebak email mana yang terdaftar.
   */
  async login(input: LoginInput): Promise<{ user: AuthUserDto; token: string }> {
    const row = await this.userRepository.findByEmail(input.email);

    if (!row) {
      throw new UnauthorizedError('Email atau password tidak sesuai.');
    }

    let passwordValid = false;

    try {
      passwordValid = await bcrypt.compare(input.password, row.passwordHash);
    } catch {
      passwordValid = false;
    }

    if (!passwordValid) {
      throw new UnauthorizedError('Email atau password tidak sesuai.');
    }

    const user = this.toDto(row);
    const token = signToken(user);

    return { user, token };
  }

  /**
   * Registrasi publik hanya untuk customer. Password di-hash sebelum masuk
   * database; password asli tidak pernah disimpan atau dikembalikan.
   */
  async register(input: RegisterInput): Promise<AuthUserDto> {
    const existing = await this.userRepository.findByEmail(input.email);

    if (existing) {
      throw new ConflictError(
        'EMAIL_TAKEN',
        'Email sudah terdaftar. Silakan masuk atau gunakan email lain.',
        [{ field: 'email', message: 'Email ini sudah dipakai akun lain.' }],
      );
    }

    const passwordHash = await bcrypt.hash(input.password, env.bcryptSaltRounds);

    try {
      const created = await this.userRepository.createCustomer({
        name: input.name,
        email: input.email,
        passwordHash,
      });

      if (!created) {
        throw new Error('User baru tidak dapat dibaca kembali setelah dibuat.');
      }

      return this.toDto(created);
    } catch (error) {
      // Tetap tangani balapan dua request dengan email yang sama.
      if (isUniqueViolation(error)) {
        throw new ConflictError(
          'EMAIL_TAKEN',
          'Email sudah terdaftar. Silakan masuk atau gunakan email lain.',
          [{ field: 'email', message: 'Email ini sudah dipakai akun lain.' }],
        );
      }

      throw error;
    }
  }

  async me(userId: number): Promise<AuthUserDto> {
    const row = await this.userRepository.findById(userId);

    if (!row) {
      throw new UnauthorizedError('Sesi login tidak valid.');
    }

    return this.toDto(row);
  }
}
