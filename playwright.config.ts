import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const FIXTURE_PORT = 3101;

/*
 * Two servers:
 * - `next start` (production build) with NO credentials and NO fixtures: the
 *   state a visitor sees today. Exercises empty states and fail-closed admin.
 * - `next dev` with ENABLE_DEV_FIXTURES=1: labelled sample releases and the
 *   synthesised test signal, so the player and turntable can be driven for real.
 * Authenticated admin flows need a Clerk test instance and come later.
 */
const launchOptions = process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {};
const noCredentials = { CLERK_SECRET_KEY: '', NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '', DATABASE_URL: '' };

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { trace: 'retain-on-failure', launchOptions },
  projects: [
    { name: 'desktop', testIgnore: 'fixtures/**', use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PORT}` } },
    {
      name: 'mobile',
      testIgnore: 'fixtures/**',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PORT}`, viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
    },
    {
      name: 'fixtures',
      testMatch: 'fixtures/**',
      timeout: 60_000,
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${FIXTURE_PORT}`, hasTouch: true },
    },
  ],
  webServer: [
    {
      command: `npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      env: { ...noCredentials, ENABLE_DEV_FIXTURES: '' },
    },
    {
      command: `npx next dev -p ${FIXTURE_PORT}`,
      url: `http://localhost:${FIXTURE_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: { ...noCredentials, ENABLE_DEV_FIXTURES: '1' },
    },
  ],
});
