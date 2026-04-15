/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  extensionsToTreatAsEsm: ['.ts'],
  setupFiles: ['<rootDir>/tests/helpers/setup.cjs'],
  collectCoverageFrom: [
    'interfaces/**/*.ts',
    'application/**/*.ts',
    'infrastructure/**/*.ts',
    '!**/*.d.ts',
  ],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testTimeout: 15000,
  clearMocks: true,
};