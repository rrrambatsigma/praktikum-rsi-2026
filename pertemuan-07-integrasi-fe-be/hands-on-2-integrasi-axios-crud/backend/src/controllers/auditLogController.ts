import type { Request, Response } from 'express';
import { getValidated } from '../middlewares/validate.ts';
import type { AuditQuery } from '../schemas/auditSchema.ts';
import { AuditLogService } from '../services/auditLogService.ts';

export class AuditLogController {
  private auditLogService: AuditLogService;

  constructor(auditLogService: AuditLogService = new AuditLogService()) {
    this.auditLogService = auditLogService;
  }

  list = async (_req: Request, res: Response): Promise<void> => {
    const query = getValidated<AuditQuery>(res, 'query');
    const data = await this.auditLogService.list(query);

    res.status(200).json({ status: 'success', data });
  };
}
