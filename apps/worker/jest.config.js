// Jest config for the worker. Mirrors apps/api/jest.config.js: ts-jest so tests
// run TypeScript directly, and @url-shortner/db mapped to its TS source so
// tests don't need a separate build step first.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  moduleNameMapper: {
    '^@url-shortner/db$': '<rootDir>/../../packages/db/src/index.ts',
  },
  setupFiles: ['<rootDir>/tests/setup/loadEnv.ts'],
  clearMocks: true,
};
