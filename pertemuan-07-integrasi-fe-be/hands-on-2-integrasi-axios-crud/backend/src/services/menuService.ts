import type { MenuDto } from '../dtos/menuDto.ts';
import { AppError } from '../errors/AppError.ts';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { MenuRepository, type MenuRow } from '../repositories/menuRepository.ts';
import { StallRepository } from '../repositories/stallRepository.ts';
import type { MenuInput, MenuQuery } from '../schemas/menuSchema.ts';
import type { AuthUser } from '../types/user.ts';
import { AuditLogService } from './auditLogService.ts';

export class MenuService {
  private menuRepository: MenuRepository;
  private stallRepository: StallRepository;
  private auditLogService: AuditLogService;

  constructor(
    menuRepository: MenuRepository = new MenuRepository(),
    stallRepository: StallRepository = new StallRepository(),
    auditLogService: AuditLogService = new AuditLogService(),
  ) {
    this.menuRepository = menuRepository;
    this.stallRepository = stallRepository;
    this.auditLogService = auditLogService;
  }

  private toDto(row: MenuRow): MenuDto {
    return {
      id: row.id,
      stallId: row.stallId,
      stallName: row.stallName,
      name: row.name,
      price: Number(row.price),
      isAvailable: Boolean(row.isAvailable),
    };
  }

  async list(params: MenuQuery): Promise<MenuDto[]> {
    const rows = await this.menuRepository.findAll({
      stallId: params.stallId,
      search: params.search,
      available: params.available === undefined ? undefined : params.available === 'true',
    });

    return rows.map((row) => this.toDto(row));
  }

  async get(id: number): Promise<MenuDto> {
    const row = await this.menuRepository.findById(id);
    if (!row) throw new NotFoundError('Menu tidak ditemukan');
    return this.toDto(row);
  }

  async create(input: MenuInput, user: AuthUser): Promise<MenuDto> {
    const stall = await this.stallRepository.findById(input.stallId);
    if (!stall) throw new NotFoundError('Warung tidak ditemukan');

    if (user.role === 'owner' && stall.ownerId !== user.id) {
      throw new ForbiddenError('Kamu hanya bisa menambah menu pada warung milikmu');
    }

    const row = await this.menuRepository.create(input);
    if (!row) throw new AppError(500, 'Menu gagal dibuat');

    await this.auditLogService.record({
      userId: user.id,
      action: 'CREATE_MENU',
      targetTable: 'MENU_ITEMS',
      targetId: row.id,
      metadata: { name: row.name, stallId: row.stallId },
    });

    return this.toDto(row);
  }

  async update(id: number, input: MenuInput, user: AuthUser): Promise<MenuDto> {
    const current = await this.menuRepository.findById(id);
    if (!current) throw new NotFoundError('Menu tidak ditemukan');

    if (user.role === 'owner' && current.stallOwnerId !== user.id) {
      throw new ForbiddenError('Kamu hanya bisa mengubah menu warung milikmu');
    }

    const targetStall = await this.stallRepository.findById(input.stallId);
    if (!targetStall) throw new NotFoundError('Warung tidak ditemukan');

    if (user.role === 'owner' && targetStall.ownerId !== user.id) {
      throw new ForbiddenError('Kamu hanya bisa memindahkan menu ke warung milikmu');
    }

    const row = await this.menuRepository.update(id, input);
    if (!row) throw new NotFoundError('Menu tidak ditemukan');

    await this.auditLogService.record({
      userId: user.id,
      action: 'UPDATE_MENU',
      targetTable: 'MENU_ITEMS',
      targetId: row.id,
      metadata: { name: row.name, stallId: row.stallId },
    });

    return this.toDto(row);
  }

  async delete(id: number, user: AuthUser): Promise<void> {
    const current = await this.menuRepository.findById(id);
    if (!current) throw new NotFoundError('Menu tidak ditemukan');

    if (user.role === 'owner' && current.stallOwnerId !== user.id) {
      throw new ForbiddenError('Kamu hanya bisa menghapus menu warung milikmu');
    }

    const removed = await this.menuRepository.remove(id);
    if (!removed) throw new NotFoundError('Menu tidak ditemukan');

    await this.auditLogService.record({
      userId: user.id,
      action: 'DELETE_MENU',
      targetTable: 'MENU_ITEMS',
      targetId: id,
      metadata: { name: current.name, stallId: current.stallId },
    });
  }
}
