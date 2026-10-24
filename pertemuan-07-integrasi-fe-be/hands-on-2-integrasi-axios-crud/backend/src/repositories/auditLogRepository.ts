import sql from 'mssql';
import { createRequest } from '../db/request.ts';

export interface AuditLogRow {
  id: number;
  userId: number;
  userName: string;
  action: string;
  targetTable: string;
  targetId: number;
  metadata: string | null;
  createdAt: Date | null;
}

export interface CreateAuditLogInput {
  userId: number;
  action: string;
  targetTable: string;
  targetId: number;
  metadata?: unknown;
}

export interface FindAuditLogsParams {
  action?: string;
  targetTable?: string;
}

const auditSelect = `
  SELECT
    a.id,
    a.user_id AS userId,
    u.name AS userName,
    a.action,
    a.target_table AS targetTable,
    a.target_id AS targetId,
    a.metadata,
    a.created_at AS createdAt
  FROM dbo.AUDIT_LOGS a
  INNER JOIN dbo.USERS u ON u.id = a.user_id
`;

export class AuditLogRepository {
  async create(input: CreateAuditLogInput, transaction?: sql.Transaction): Promise<void> {
    const request = await createRequest(transaction);
    const metadata =
      input.metadata === undefined ? null : JSON.stringify(input.metadata);

    await request
      .input('userId', sql.Int, input.userId)
      .input('action', sql.NVarChar(50), input.action)
      .input('targetTable', sql.NVarChar(50), input.targetTable)
      .input('targetId', sql.Int, input.targetId)
      .input('metadata', sql.NVarChar(sql.MAX), metadata)
      .query(`
        INSERT INTO dbo.AUDIT_LOGS (user_id, action, target_table, target_id, metadata)
        VALUES (@userId, @action, @targetTable, @targetId, @metadata)
      `);
  }

  async findAll(params: FindAuditLogsParams = {}): Promise<AuditLogRow[]> {
    const request = await createRequest();
    const result = await request
      .input('action', sql.NVarChar(50), params.action ?? null)
      .input('targetTable', sql.NVarChar(50), params.targetTable ?? null)
      .query<AuditLogRow>(`
        ${auditSelect}
        WHERE (@action IS NULL OR a.action = @action)
          AND (@targetTable IS NULL OR a.target_table = @targetTable)
        ORDER BY a.created_at DESC, a.id DESC
      `);

    return result.recordset;
  }
}
