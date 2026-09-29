import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/userRepository.ts';
import { signToken, type AuthUser } from './tokenService.ts';
import { AppError } from '../errors/AppError.ts';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';
import type { LoginInput, RegisterInput } from '../schemas/authSchema.ts';
import type { AuthUserDto, LoginResponseDto } from '../dtos/authDto.ts';

type UserRow = NonNullable<Awaited<ReturnType<UserRepository['findByEmail']>>>;

/** Biaya bcrypt: jumlah iterasi hashing. Makin besar = makin lambat & aman. */
function getSaltRounds(): number {
  return Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
}

export class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  // Mapping row DB -> DTO. Perhatikan passwordHash SENGAJA tidak ikut,
  // itulah gunanya DTO: bentuk respons API tidak sama dengan bentuk tabel.
  private toDto(row: UserRow): AuthUserDto {
    return { id: row.id, name: row.name, email: row.email, role: row.role };
  }

  async register(input: RegisterInput): Promise<AuthUserDto> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError(409, 'Email sudah terdaftar');
    }

    // Password di-hash dengan salt acak. Password asli tidak pernah disimpan
    // dan tidak pernah dikembalikan ke client.
    const passwordHash = await bcrypt.hash(input.password, getSaltRounds());

    const row = await this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      // Role ditentukan server, bukan client. Pendaftaran mandiri = customer.
      role: 'customer',
    });
    if (!row) throw new AppError(500, 'User gagal dibuat');

    return this.toDto(row);
  }

  async login(input: LoginInput): Promise<LoginResponseDto> {
    const row = await this.userRepository.findByEmail(input.email);

    // Pesan sengaja sama untuk "email tidak terdaftar" dan "password salah",
    // supaya penyerang tidak bisa menebak email mana yang memang terdaftar.
    if (!row) throw new UnauthorizedError('Email atau password salah');

    const passwordValid = await bcrypt.compare(input.password, row.passwordHash);
    if (!passwordValid) throw new UnauthorizedError('Email atau password salah');

    const user: AuthUser = this.toDto(row);
    return {
      token: signToken(user),
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
      user,
    };
  }
}