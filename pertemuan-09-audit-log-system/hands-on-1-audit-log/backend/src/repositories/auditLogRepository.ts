import sql from 'mssql';
import { getPool } from '../db/pool.ts';
import { createRequest } from '../db/request.ts';
import type { AuditLogDto } from '../dtos/auditLogDto.ts';
import type { AuditLogQuery } from '../schemas/auditLogSchema.ts';

export interface AuditEntry {
  userId: number;
  action: string;
  targetTable: string;
  targetId: number;
  metadata?: unknown;
}

interface AuditLogRow {
  id: number;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  targetTable: string;
  targetId: number | null;
  metadata: string | null;
  createdAt: Date | string;
}

const auditSelect = `
  SELECT
    a.id,
    a.user_id AS userId,
    u.name AS userName,
    u.email AS userEmail,
    a.action,
    a.target_table AS targetTable,
    a.target_id AS targetId,
    a.metadata,
    a.created_at AS createdAt
  FROM dbo.AUDIT_LOGS a
  LEFT JOIN dbo.USERS u ON u.id = a.user_id
`;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseMetadata(value: string | null): unknown {
  if (value === null) return null;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function toDto(row: AuditLogRow): AuditLogDto {
  return {
    id: row.id,
    userId: row.userId === null ? null : Number(row.userId),
    userName: row.userName,
    userEmail: row.userEmail,
    action: row.action,
    targetTable: row.targetTable,
    targetId: row.targetId === null ? null : Number(row.targetId),
    metadata: parseMetadata(row.metadata),
    createdAt: toIso(row.createdAt),
  };
}

function startOfDay(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function endOfDayExclusive(value: string): Date {
  const date = startOfDay(value);
  date.setDate(date.getDate() + 1);
  return date;
}

function applyFilters(request: sql.Request, query: AuditLogQuery): string {
  const conditions: string[] = [];

  if (query.action) {
    request.input('action', sql.NVarChar(50), query.action);
    conditions.push('a.action = @action');
  }

  if (query.targetTable) {
    request.input('targetTable', sql.NVarChar(50), query.targetTable);
    conditions.push('a.target_table = @targetTable');
  }

  if (query.from) {
    request.input('from', startOfDay(query.from));
    conditions.push('a.created_at >= @from');
  }

  if (query.to) {
    request.input('to', endOfDayExclusive(query.to));
    conditions.push('a.created_at < @to');
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

export class AuditLogRepository {
  /**
   * `transaction` diisi saat insert ikut transaksi mutasi bisnis. Tanpa
   * `transaction`, insert memakai pool sendiri (dipakai untuk audit LOGIN
   * yang best-effort).
   */
  async insert(
    entry: AuditEntry,
    transaction?: sql.Transaction,
  ): Promise<void> {
    const target = await createRequest(transaction);
    const metadata =
      entry.metadata === undefined ? null : JSON.stringify(entry.metadata);

    await target
      .input('userId', sql.Int, entry.userId)
      .input('action', sql.NVarChar(50), entry.action)
      .input('targetTable', sql.NVarChar(50), entry.targetTable)
      .input('targetId', sql.Int, entry.targetId)
      .input('metadata', sql.NVarChar(sql.MAX), metadata)
      .query(`
        INSERT INTO dbo.AUDIT_LOGS
          (user_id, action, target_table, target_id, metadata)
        VALUES
          (@userId, @action, @targetTable, @targetId, @metadata)
      `);
  }

  async findPage(
    query: AuditLogQuery,
  ): Promise<{ items: AuditLogDto[]; total: number }> {
    const pool = await getPool();
    const listRequest = pool.request();
    const where = applyFilters(listRequest, query);

    listRequest
      .input('offset', sql.Int, (query.page - 1) * query.pageSize)
      .input('pageSize', sql.Int, query.pageSize);

    const listResult = await listRequest.query<AuditLogRow>(`
      ${auditSelect}
      ${where}
      ORDER BY a.created_at DESC, a.id DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `);

    const countRequest = pool.request();
    const countWhere = applyFilters(countRequest, query);
    const countResult = await countRequest.query<{ total: number }>(`
      SELECT COUNT(*) AS total
      FROM dbo.AUDIT_LOGS a
      ${countWhere}
    `);

    return {
      items: listResult.recordset.map(toDto),
      total: Number(countResult.recordset[0]?.total ?? 0),
    };
  }
}
