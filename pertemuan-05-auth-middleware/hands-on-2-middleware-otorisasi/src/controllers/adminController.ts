import type { Request, Response } from 'express';
import { ReportService } from '../services/reportService.ts';
import { getUser } from '../middlewares/auth.ts';

export class AdminController {
  private reportService: ReportService;

  constructor(reportService: ReportService = new ReportService()) {
    this.reportService = reportService;
  }

  getReports = async (req: Request, res: Response): Promise<void> => {
    // Middleware sudah menjamin role admin, jadi di sini tidak perlu
    // pengecekan role lagi — cukup mencatat siapa yang meminta laporan.
    const { email } = getUser(req);
    const data = await this.reportService.getSummary();

    res.status(200).json({
      status: 'success',
      meta: { requestedBy: email },
      data,
    });
  };
}