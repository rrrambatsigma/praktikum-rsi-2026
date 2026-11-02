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

  async getMenuById(id: number): Promise<MenuDto> {
    const row = await this.menuRepository.findById(id);

    if (!row) {
      throw new NotFoundError('MENU_NOT_FOUND', 'Menu tidak ditemukan.');
    }

    return this.toDto(row);
  }

  private async ensureStallOwned(stallId: number, user: AuthUser): Promise<void> {
    const stall = await this.stallRepository.findById(stallId);

    if (!stall) {
      throw new NotFoundError('STALL_NOT_FOUND', 'Warung tidak ditemukan.', [
        { field: 'stallId', message: 'Warung yang dipilih tidak ditemukan.' },
      ]);
    }

    if (!canManageStall(stall.ownerId, user)) {
      throw new AppError(
        403,
        'STALL_FORBIDDEN',
        'Anda hanya dapat mengelola menu pada warung milik Anda.',
        [{ field: 'stallId', message: 'Warung ini bukan milik akun Anda.' }],
      );
    }
  }

  private async ensureNameAvailable(
    name: string,
    stallId: number,
    excludeId?: number,
  ): Promise<void> {
    const exists = await this.menuRepository.existsByNameInStall(
      name,
      stallId,
      excludeId,
    );

    if (exists) {
      throw new ConflictError(
        'MENU_NAME_TAKEN',
        'Nama menu sudah dipakai di warung ini.',
        [{ field: 'name', message: 'Gunakan nama menu yang berbeda.' }],
      );
    }
  }

  async createMenu(input: CreateMenuInput, user: AuthUser): Promise<MenuDto> {
    await this.ensureStallOwned(input.stallId, user);
    await this.ensureNameAvailable(input.name, input.stallId);

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

  async updateMenu(
    id: number,
    input: CreateMenuInput,
    user: AuthUser,
  ): Promise<MenuDto> {
    const current = await this.menuRepository.findById(id);

    if (!current) {
      throw new NotFoundError('MENU_NOT_FOUND', 'Menu tidak ditemukan.');
    }

    if (!canManageStall(current.stallOwnerId, user)) {
      throw new AppError(
        403,
        'MENU_FORBIDDEN',
        'Anda hanya dapat mengubah menu milik warung Anda.',
        [{ field: 'id', message: 'Menu ini bukan milik akun Anda.' }],
      );
    }

    await this.ensureStallOwned(input.stallId, user);
    await this.ensureNameAvailable(input.name, input.stallId, id);

    const updated = await this.menuRepository.update(id, input);

    if (!updated) {
      throw new NotFoundError('MENU_NOT_FOUND', 'Menu tidak ditemukan.');
    }

    return this.toDto(updated);
  }

  async deleteMenu(id: number, user: AuthUser): Promise<void> {
    const current = await this.menuRepository.findById(id);

    if (!current) {
      throw new NotFoundError('MENU_NOT_FOUND', 'Menu tidak ditemukan.');
    }

    if (!canManageStall(current.stallOwnerId, user)) {
      throw new AppError(
        403,
        'MENU_FORBIDDEN',
        'Anda hanya dapat menghapus menu milik warung Anda.',
        [{ field: 'id', message: 'Menu ini bukan milik akun Anda.' }],
      );
    }

    const deleted = await this.menuRepository.delete(id);

    if (!deleted) {
      throw new NotFoundError('MENU_NOT_FOUND', 'Menu tidak ditemukan.');
    }
  }
}
