import { defineConfig } from 'vitest/config';
import { alias } from './vitest.config';

export default defineConfig({
  resolve: { alias },
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    // One database, so files run one at a time.
    fileParallelism: false,
    globalSetup: ['tests/integration/global-setup.ts'],
    testTimeout: 20000,
  },
});
