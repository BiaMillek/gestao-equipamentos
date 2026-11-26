import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    fileParallelism: false, // testes de integração compartilham o mesmo banco
    testTimeout: 20000,
    hookTimeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/tests/**', 'src/server.ts'], // testes e ponto de entrada (listen)
      thresholds: { lines: 60, statements: 60, functions: 60, branches: 60 },
    },
  },
});
