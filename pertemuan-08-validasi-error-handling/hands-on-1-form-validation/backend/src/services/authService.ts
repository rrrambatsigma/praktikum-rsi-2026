import bcrypt from 'bcryptjs';
import type { AuthUserDto } from '../dtos/authDto.ts';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';
import { UserRepository, type UserRow } from '../repositories/userRepository.ts';
import type { LoginInput } from '../schemas/authSchema.ts';
import { signToken } from './tokenService.ts';

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

  async me(userId: number): Promise<AuthUserDto> {
    const row = await this.userRepository.findById(userId);

    if (!row) {
      throw new UnauthorizedError('Sesi login tidak valid.');
    }

    return this.toDto(row);
  }
}
