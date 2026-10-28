import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://petshop:test_password@localhost:25432/petshop_test',
      REDIS_URL: process.env.TEST_REDIS_URL || 'redis://localhost:26379/15',
      // Não carregar credenciais locais/privadas ao importar a aplicação nos testes.
      FIREBASE_PROJECT_ID: 'petshop-test',
      FIREBASE_SERVICE_ACCOUNT_JSON: '',
    },
  },
});
