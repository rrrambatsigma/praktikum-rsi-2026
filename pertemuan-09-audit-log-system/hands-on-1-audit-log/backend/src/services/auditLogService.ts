import type sql from 'mssql';
import type { AuditLogPageDto } from '../dtos/auditLogDto.ts';
import {
  AuditLogRepository,
  type AuditEntry,
} from '../repositories/auditLogRepository.ts';
import type { AuditLogQuery } from '../schemas/auditLogSchema.ts';
import type { AuthUser } from '../types/user.ts';

export class AuditLogService {
  constructor(
    private readonly auditLogRepository: AuditLogRepository = new AuditLogRepository(),
  ) {}

  /** Dipanggil di dalam transaksi mutasi bisnis supaya audit ikut atomik. */
  async record(
    entry: AuditEntry,
    transaction?: sql.Transaction,
  ): Promise<void> {
    await this.auditLogRepository.insert(entry, transaction);
  }

  /**
   * Login tetap berhasil walau penulisan audit gagal. Kegagalan audit tidak
   * boleh mengunci pengguna dari aplikasi.
   */
  async recordLogin(user: AuthUser): Promise<void> {
    try {
      await this.record({
        userId: user.id,
        action: 'LOGIN',
        targetTable: 'USERS',
        targetId: user.id,
        metadata: { role: user.role },
      });
    } catch (error) {
      console.error('Audit LOGIN gagal dicatat:', error);
    }
  }

  async list(query: AuditLogQuery): Promise<AuditLogPageDto> {
    const { items, total } = await this.auditLogRepository.findPage(query);
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.pageSize);

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
      },
    };
  }
}
