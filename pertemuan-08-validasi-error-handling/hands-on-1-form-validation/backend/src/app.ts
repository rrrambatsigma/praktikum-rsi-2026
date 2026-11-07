import cookieParser from 'cookie-parser';
import express, { type Application } from 'express';
import { env } from './config/env.ts';
import { getPool } from './db/pool.ts';
import { corsMiddleware } from './middlewares/cors.ts';
import { errorHandler } from './middlewares/errorHandler.ts';
import { notFoundHandler } from './middlewares/notFound.ts';
import { authRouter } from './routes/authRouter.ts';
import { devRouter } from './routes/devRouter.ts';
import { menuRouter } from './routes/menuRouter.ts';
import { stallRouter } from './routes/stallRouter.ts';

const app: Application = express();

app.disable('x-powered-by');
app.use(corsMiddleware);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/health', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query<{ ok: number }>('SELECT 1 AS ok');

    res.status(200).json({
      status: 'success',
      message: 'Server dan database terhubung.',
      database: { ok: result.recordset[0]?.ok ?? 1 },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check gagal:', error);
    res.status(500).json({
      status: 'error',
      code: 'DATABASE_ERROR',
      message: 'Gagal terhubung ke database.',
    });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/stalls', stallRouter);
app.use('/api/menu', menuRouter);

// Endpoint bantu pengujian. Tidak didaftarkan di production.
if (env.nodeEnv !== 'production') {
  app.use('/api/dev', devRouter);
}

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
