import express, { type Application } from 'express';
import { sql } from 'drizzle-orm';
import swaggerUi from 'swagger-ui-express';
import { getDb } from './db/index.ts';
import { authRouter } from './routes/authRouter.ts';
import { stallRouter } from './routes/stallRouter.ts';
import { adminRouter } from './routes/adminRouter.ts';
import { notFoundHandler } from './middlewares/notFound.ts';
import { errorHandler } from './middlewares/errorHandler.ts';
import { openApiDocument } from './docs/openapi.ts';

const app: Application = express();
const PORT: number = 3000;

app.use(express.json());

// Raw spek OpenAPI 3.0 (hasil generate di memori) — untuk import ke Postman/dll.
// Wajib didaftarkan SEBELUM app.use('/docs', swaggerUi.serve, ...) karena
// swagger-ui-express menangkap setiap path di bawah /docs dan mengembalikan index.html.
app.get('/docs/swagger.json', (_req, res) => {
  res.status(200).json(openApiDocument);
});

// Dokumentasi API OpenAPI 3.0 (dibangkitkan dari schema zod di memori).
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Tanpa try/catch: Express 5 meneruskan handler async yang reject ke errorHandler.
app.get('/health', async (_req, res) => {
  const db = await getDb();
  await db.execute(sql`SELECT 1 AS ok`);
  res.status(200).json({ status: 'success', message: 'Server dan database terhubung' });
});

// Autentikasi: register & login. Dua-duanya route publik.
app.use('/api/v1/auth', authRouter);

// Stall tidak semuanya publik lagi — middleware dipasang per-route di dalam
// stallRouter, sehingga yang tetap publik masih bisa dibaca tanpa token.
app.use('/api/v1/stalls', stallRouter);

// Router khusus admin. Seluruh route di dalamnya dijaga authorize('admin'),
// jadi menambah route baru di sini otomatis ikut terlindungi selama
// middleware-nya tidak lupa ditulis.
app.use('/api/v1/admin', adminRouter);

// 404 untuk rute yang tidak dikenal, lalu error handling terpusat (paling akhir).
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});