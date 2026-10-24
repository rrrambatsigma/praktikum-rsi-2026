import type { MenuDto } from '../dtos/menuDto.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { MenuRepository, type MenuRow } from '../repositories/menuRepository.ts';
import { StallRepository } from '../repositories/stallRepository.ts';
import type { CreateMenuInput, UpdateMenuInput } from '../schemas/menuSchema.ts';

export class MenuService {
  private menuRepository: MenuRepository;
  private stallRepository: StallRepository;

  constructor(
    menuRepository: MenuRepository = new MenuRepository(),
    stallRepository: StallRepository = new StallRepository(),
  ) {
    this.menuRepository = menuRepository;
    this.stallRepository = stallRepository;
  }

  private toDto(row: MenuRow): MenuDto {
    return {
      id: row.id,
      stallId: row.stallId,
      stallName: row.stallName,
      name: row.name,
      price: row.price,
      isAvailable: row.isAvailable,
    };
  }

  private async ensureStallExists(stallId: number): Promise<void> {
    const stall = await this.stallRepository.findById(stallId);

    if (!stall) {
      throw new NotFoundError('Warung tidak ditemukan');
    }
  }

  async getAllMenus(): Promise<MenuDto[]> {
    const rows = await this.menuRepository.findAll();
    return rows.map((row) => this.toDto(row));
  }

  async getMenuById(id: number): Promise<MenuDto> {
    const row = await this.menuRepository.findById(id);

    if (!row) {
      throw new NotFoundError('Menu tidak ditemukan');
    }

    return this.toDto(row);
  }

  async createMenu(input: CreateMenuInput): Promise<MenuDto> {
    await this.ensureStallExists(input.stallId);
    const createdId = await this.menuRepository.create(input);

    if (!createdId) {
      throw new NotFoundError('Menu gagal dibuat');
    }

    return this.getMenuById(createdId);
  }

  async updateMenu(id: number, input: UpdateMenuInput): Promise<MenuDto> {
    const current = await this.menuRepository.findById(id);

    if (!current) {
      throw new NotFoundError('Menu tidak ditemukan');
    }

    await this.ensureStallExists(input.stallId);
    const updatedId = await this.menuRepository.update(id, input);

    if (!updatedId) {
      throw new NotFoundError('Menu tidak ditemukan');
    }

    return this.getMenuById(updatedId);
  }

  async deleteMenu(id: number): Promise<void> {
    const removed = await this.menuRepository.remove(id);

    if (!removed) {
      throw new NotFoundError('Menu tidak ditemukan');
    }
  }
}
