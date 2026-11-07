import { withTransaction } from '../db/transaction.ts';
import type { MenuDto } from '../dtos/menuDto.ts';
import { AppError } from '../errors/AppError.ts';
import { ConflictError } from '../errors/ConflictError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { MenuRepository, type MenuRow } from '../repositories/menuRepository.ts';
import { StallRepository } from '../repositories/stallRepository.ts';
import type { CreateMenuInput } from '../schemas/menuSchema.ts';
import type { AuthUser } from '../types/user.ts';
import { AuditLogService } from './auditLogService.ts';
import { canManageStall } from './menuOwnership.ts';

export class MenuService {
  constructor(
    private readonly menuRepository: MenuRepository = new MenuRepository(),
    private readonly stallRepository: StallRepository = new StallRepository(),
    private readonly auditLogService: AuditLogService = new AuditLogService(),
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

  private changedFields(before: MenuDto, after: MenuDto): string[] {
    const fields: Array<
      keyof Pick<
        MenuDto,
        'stallId' | 'name' | 'category' | 'price' | 'description' | 'isAvailable'
      >
    > = ['stallId', 'name', 'category', 'price', 'description', 'isAvailable'];

    return fields.filter((field) => before[field] !== after[field]);
  }

  async createMenu(input: CreateMenuInput, user: AuthUser): Promise<MenuDto> {
    await this.ensureStallOwned(input.stallId, user);
    await this.ensureNameAvailable(input.name, input.stallId);

    return withTransaction(async (transaction) => {
      const created = await this.menuRepository.create(input, transaction);

      if (!created) {
        throw new AppError(
          500,
          'INTERNAL_ERROR',
          'Menu gagal disimpan. Silakan coba lagi.',
        );
      }

      const data = this.toDto(created);

      await this.auditLogService.record(
        {
          userId: user.id,
          action: 'CREATE_MENU',
          targetTable: 'MENU_ITEMS',
          targetId: data.id,
          metadata: { after: data },
        },
        transaction,
      );

      return data;
    });
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

    return withTransaction(async (transaction) => {
      const updated = await this.menuRepository.update(id, input, transaction);

      if (!updated) {
        throw new NotFoundError('MENU_NOT_FOUND', 'Menu tidak ditemukan.');
      }

      const before = this.toDto(current);
      const after = this.toDto(updated);

      await this.auditLogService.record(
        {
          userId: user.id,
          action: 'UPDATE_MENU',
          targetTable: 'MENU_ITEMS',
          targetId: id,
          metadata: {
            before,
            after,
            changed: this.changedFields(before, after),
          },
        },
        transaction,
      );

      return after;
    });
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

    return withTransaction(async (transaction) => {
      const deleted = await this.menuRepository.delete(id, transaction);

      if (!deleted) {
        throw new NotFoundError('MENU_NOT_FOUND', 'Menu tidak ditemukan.');
      }

      await this.auditLogService.record(
        {
          userId: user.id,
          action: 'DELETE_MENU',
          targetTable: 'MENU_ITEMS',
          targetId: id,
          metadata: { before: this.toDto(current) },
        },
        transaction,
      );
    });
  }
}
