import sql from 'mssql';
import type { AuditLogDto } from '../dtos/auditDto.ts';
import type { AuditQuery } from '../schemas/auditSchema.ts';
import {
  AuditLogRepository,
  type AuditLogRow,
  type CreateAuditLogInput,
} from '../repositories/auditLogRepository.ts';

export class AuditLogService {
  private auditLogRepository: AuditLogRepository;

  constructor(auditLogRepository: AuditLogRepository = new AuditLogRepository()) {
    this.auditLogRepository = auditLogRepository;
  }

  private toDto(row: AuditLogRow): AuditLogDto {
    return {
      id: row.id,
      userId: row.userId,
      userName: row.userName,
      action: row.action,
      targetTable: row.targetTable,
      targetId: row.targetId,
      metadata: row.metadata,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    };
  }

  async record(input: CreateAuditLogInput, transaction?: sql.Transaction): Promise<void> {
    await this.auditLogRepository.create(input, transaction);
  }

  async list(params: AuditQuery): Promise<AuditLogDto[]> {
    const rows = await this.auditLogRepository.findAll(params);
    return rows.map((row) => this.toDto(row));
  }
}
