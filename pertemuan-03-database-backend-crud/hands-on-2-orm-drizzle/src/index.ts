import express, { type Request, type Response, type Application } from 'express';
import { sql } from 'drizzle-orm';
import swaggerUi from 'swagger-ui-express';
import { getDb } from './db/index.ts';
import { stallRouter } from './routes/stallRouter.ts';
import { openapiSpec } from './docs/openapi.ts';

const app: Application = express();
const PORT: number = 3000;

app.use(express.json());

// Dokumentasi API (Swagger UI) — spesifikasi masih kosong.
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Cek koneksi server & database
 *     responses:
 *       200:
 *         description: OK
 */
app.get('/health', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.execute(sql`SELECT 1 AS ok`);
    res.status(200).json({ status: 'success', message: 'Server dan database terhubung' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal terhubung ke database',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.use('/api/v1/stalls', stallRouter);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
