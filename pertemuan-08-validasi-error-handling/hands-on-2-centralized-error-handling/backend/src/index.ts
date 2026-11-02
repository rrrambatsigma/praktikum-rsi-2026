import { app } from './app.ts';
import { env } from './config/env.ts';
import { closePool } from './db/pool.ts';

const server = app.listen(env.port, () => {
  console.log(`Server berjalan di http://localhost:${env.port}`);
  console.log(`Health check: http://localhost:${env.port}/health`);
});

function shutdown(signal: string): void {
  console.log(`Menerima ${signal}. Menutup server...`);

  server.close(() => {
    void closePool()
      .catch((error: unknown) => {
        console.error('Gagal menutup pool database:', error);
      })
      .finally(() => {
        process.exit(0);
      });
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
