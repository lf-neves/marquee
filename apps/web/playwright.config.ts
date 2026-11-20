import { defineConfig, devices } from '@playwright/test';

const port = 3100;
const baseURL = `http://localhost:${port}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // The production build runs with the Instant Navigation testing API exposed and the catalog
    // served from fixtures, so the suite never reaches TMDB.
    command: `pnpm build && pnpm start --port ${port}`,
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 600_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      TMDB_FIXTURES: '1',
      EXPOSE_TESTING_API: '1',
      NEXT_PUBLIC_SITE_URL: baseURL,
      ...(process.env.DATABASE_URL ? { DATABASE_URL: process.env.DATABASE_URL } : {}),
    },
  },
});
