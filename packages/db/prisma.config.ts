import path from 'node:path';
import { defineConfig } from 'prisma/config';

// The repository keeps one .env at its root; Prisma 7 no longer loads env files on its own.
try {
  process.loadEnvFile(path.resolve(import.meta.dirname, '../../.env'));
} catch {
  // No .env file: rely on the process environment, as CI and Vercel do.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
