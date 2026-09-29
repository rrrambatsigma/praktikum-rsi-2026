import express, { type Application } from 'express';
import { sql } from 'drizzle-orm';
import { getDb } from './db/index.ts';
import { stallRouter } from './routes/stallRouter.ts';
import { notFoundHandler } from './middlewares/notFound.ts';
import { errorHandler } from './middlewares/errorHandler.ts';

const app: Application = express();
const PORT: number = 3000;

app.use(express.json());

// Tanpa try/catch: Express 5 meneruskan handler async yang reject ke errorHandler.
app.get('/health', async (_req, res) => {
  const db = await getDb();
  await db.execute(sql`SELECT 1 AS ok`);
  res.status(200).json({ status: 'success', message: 'Server dan database terhubung' });
});

app.use('/api/v1/stalls', stallRouter);

// 404 untuk rute yang tidak dikenal, lalu error handling terpusat (paling akhir).
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});