import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

/*
 * E2E runs against a production build with NO credentials configured, which
 * exercises the fail-closed paths. Authenticated admin flows need a Clerk test
 * instance and are added with Phase 2.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: { CLERK_SECRET_KEY: '', NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '', DATABASE_URL: '' },
  },
});
