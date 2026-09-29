import type { Request, Response } from 'express';
import { UserRepository } from '../repositories/userRepository.ts';
import { getUser } from '../middlewares/auth.ts';
import type { AuthUserDto } from '../dtos/authDto.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';

type UserRow = NonNullable<Awaited<ReturnType<UserRepository['findById']>>>;

/**
 * Endpoint profil untuk menunjukkan perbedaan antara "data dari token" dan
 * "data dari database".
 *
 * `getMe` (di AuthController) membalas persis isi payload token tanpa menyentuh
 * database — cepat, tapi bisa basi kalau role berubah atau akun dihapus.
 * `getProfile` di sini memuat ulang user dari database memakai `req.user.id`,
 * jadi selalu mencerminkan kondisi terbaru.
 */
export class ProfileController {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  getProfile = async (req: Request, res: Response): Promise<void> => {
    // Identitas dari token; data terbaru dari database.
    const { id } = getUser(req);

    const row: UserRow | undefined = await this.userRepository.findById(id);
    if (!row) {
      // Token-nya masih valid secara kriptografi, tapi user-nya sudah tidak ada.
      throw new NotFoundError('User tidak ditemukan');
    }

    const data: AuthUserDto = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
    };
    res.status(200).json({ status: 'success', data });
  };
}