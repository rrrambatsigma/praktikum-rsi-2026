import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLogController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';

const auditLogRouter = Router();
const auditLogController = new AuditLogController();

// Riwayat audit hanya untuk admin. Tidak ada endpoint ubah/hapus: audit
// bersifat append-only supaya jejaknya tidak bisa dimanipulasi dari aplikasi.
auditLogRouter.get(
  '/',
  authenticate,
  authorize('admin'),
  auditLogController.getAll,
);

export { auditLogRouter };
