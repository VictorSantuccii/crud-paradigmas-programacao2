import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { testTimeout: 20000, hookTimeout: 20000, fileParallelism: false, env: { DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://petshop:test_password@localhost:25432/petshop_test', REDIS_URL: process.env.TEST_REDIS_URL || 'redis://localhost:26379/15' } } });
