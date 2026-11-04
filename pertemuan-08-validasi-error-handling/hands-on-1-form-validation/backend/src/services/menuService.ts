import type { MenuDto } from '../dtos/menuDto.ts';
import { AppError } from '../errors/AppError.ts';
import { ConflictError } from '../errors/ConflictError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { MenuRepository, type MenuRow } from '../repositories/menuRepository.ts';
import { StallRepository } from '../repositories/stallRepository.ts';
import type { CreateMenuInput } from '../schemas/menuSchema.ts';
import type { AuthUser } from '../types/user.ts';
import { canManageStall } from './menuOwnership.ts';

export class MenuService {
  constructor(
    private readonly menuRepository: MenuRepository = new MenuRepository(),
    private readonly stallRepository: StallRepository = new StallRepository(),
  ) {}

  private toDto(row: MenuRow): MenuDto {
    return {
      id: row.id,
      stallId: row.stallId,
      stallName: row.stallName,
      name: row.name,
      category: row.category,
      price: row.price,
      description: row.description,
      isAvailable: row.isAvailable,
    };
  }

  async getAllMenus(): Promise<MenuDto[]> {
    const rows = await this.menuRepository.findAll();
    return rows.map((row) => this.toDto(row));
  }

  async createMenu(input: CreateMenuInput, user: AuthUser): Promise<MenuDto> {
    const stall = await this.stallRepository.findById(input.stallId);

    if (!stall) {
      throw new NotFoundError('STALL_NOT_FOUND', 'Warung tidak ditemukan.', [
        {
          field: 'stallId',
          message: 'Warung yang dipilih tidak ditemukan.',
        },
      ]);
    }

    // Inilah lapisan yang sebelumnya hilang: role Owner sudah benar, tetapi
    // warung yang dituju belum tentu miliknya.
    if (!canManageStall(stall.ownerId, user)) {
      throw new AppError(
        403,
        'STALL_FORBIDDEN',
        'Anda hanya dapat menambah menu pada warung milik Anda.',
        [
          {
            field: 'stallId',
            message: 'Warung ini bukan milik akun Anda.',
          },
        ],
      );
    }

    const nameTaken = await this.menuRepository.existsByNameInStall(
      input.name,
      input.stallId,
    );

    if (nameTaken) {
      throw new ConflictError(
        'MENU_NAME_TAKEN',
        'Nama menu sudah dipakai di warung ini.',
        [{ field: 'name', message: 'Gunakan nama menu yang berbeda.' }],
      );
    }

    const created = await this.menuRepository.create(input);

    if (!created) {
      throw new AppError(
        500,
        'INTERNAL_ERROR',
        'Menu gagal disimpan. Silakan coba lagi.',
      );
    }

    return this.toDto(created);
  }
}
