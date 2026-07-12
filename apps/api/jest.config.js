// Jest config for the API. Uses ts-jest so tests run TypeScript directly.
// The moduleNameMapper points @url-shortner/shared at its TS source, so tests
// pick up the shared schemas without a separate build step.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  moduleNameMapper: {
    '^@url-shortner/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  // Load test env before the suite runs.
  setupFiles: ['<rootDir>/tests/setup/loadEnv.ts'],
  clearMocks: true,
};
