import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export const alias = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
  // `server-only` throws outside the React server runtime; tests run in Node.
  'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
};

export default defineConfig({
  resolve: { alias },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
