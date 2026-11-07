import type { MenuDto } from '../dtos/menuDto.ts';
import { AppError } from '../errors/AppError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { MenuRepository, type MenuRow } from '../repositories/menuRepository.ts';
import { StallRepository } from '../repositories/stallRepository.ts';
import type { CreateMenuInput } from '../schemas/menuSchema.ts';

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

  async createMenu(input: CreateMenuInput): Promise<MenuDto> {
    const stall = await this.stallRepository.findById(input.stallId);

    if (!stall) {
      throw new NotFoundError('STALL_NOT_FOUND', 'Warung tidak ditemukan.', [
        {
          field: 'stallId',
          message: 'Warung yang dipilih tidak ditemukan.',
        },
      ]);
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
