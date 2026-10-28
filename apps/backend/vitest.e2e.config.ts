import { defineConfig } from 'vitest/config';
import base from './vitest.config';

export default defineConfig({
  test: {
    ...base.test,
    include: ['tests/e2e/**/*.e2e.ts'],
    hookTimeout: 30000,
  },
});
