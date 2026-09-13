import { type Request, type Response } from 'express';
import { StallService } from '../services/stallService.ts';

export class StallController {
  constructor(private stallService: StallService = new StallService()) {}

  // Menggunakan arrow function agar binding konteks 'this' tetap terjaga di Router
  getStalls = async (req: Request, res: Response): Promise<Response> => {
    try {
      const stalls = await this.stallService.getAllStalls();
      return res.status(200).json({
        status: "success",
        data: stalls
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Gagal mengambil data warung"
      });
    }
  };

  getStallById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = Number(req.params.id);
      const stall = await this.stallService.getStallById(id);
      
      return res.status(200).json({
        status: "success",
        data: stall
      });
    } catch (error: any) {
      if (error.message === "STALL_NOT_FOUND") {
        return res.status(404).json({
          status: "fail",
          message: "Data warung tidak ditemukan"
        });
      }
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server"
      });
    }
  };
}
