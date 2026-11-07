export interface AuditLogDto {
  id: number;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  targetTable: string;
  targetId: number | null;
  metadata: unknown;
  createdAt: string;
}

export interface AuditLogPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AuditLogPageDto {
  items: AuditLogDto[];
  pagination: AuditLogPagination;
}
