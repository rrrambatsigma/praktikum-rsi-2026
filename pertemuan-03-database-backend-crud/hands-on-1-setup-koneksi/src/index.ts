import express, { type Request, type Response } from 'express';
import { getPool } from './config/database.ts';

const app = express();
const PORT: number = 3000;

app.use(express.json());

// Health check: memastikan server DAN database dapat dijangkau.
app.get('/health', async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT 1 AS ok');

    res.status(200).json({
      status: 'success',
      message: 'Server dan database terhubung',
      database: result.recordset[0],
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal terhubung ke database',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
