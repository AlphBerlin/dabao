/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: [
    '<rootDir>/test/**/*.test.ts',
  ],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/test/setupTests.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@grpc/grpc-js|@grpc/proto-loader|google-protobuf)/)'
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};

export default config;