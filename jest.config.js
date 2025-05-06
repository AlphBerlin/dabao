/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
  verbose: true,
  testMatch: [
    '<rootDir>/test/**/*.test.ts',
  ],
  testTimeout: 30000, // Extended timeout for gRPC tests
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
};