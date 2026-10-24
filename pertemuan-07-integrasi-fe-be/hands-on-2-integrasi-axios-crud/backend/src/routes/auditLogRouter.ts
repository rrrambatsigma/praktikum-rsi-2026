import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLogController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';
import { validate } from '../middlewares/validate.ts';
import { auditQuerySchema } from '../schemas/auditSchema.ts';

const auditLogRouter = Router();
const auditLogController = new AuditLogController();

auditLogRouter.get(
  '/',
  authenticate,
  authorize('admin'),
  validate(auditQuerySchema, 'query'),
  auditLogController.list,
);

export { auditLogRouter };
