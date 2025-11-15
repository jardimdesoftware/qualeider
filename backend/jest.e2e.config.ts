import type { Config } from 'jest';
import baseConfig from './jest.config';

const config: Config = {
  ...baseConfig,
  displayName: 'e2e',
  testMatch: ['<rootDir>/tests/e2e/**/*.e2e-spec.ts'],
  coverageDirectory: './coverage/e2e',
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 65,
      lines: 65,
      statements: 65,
    },
  },
  // E2E tests may take even longer
  testTimeout: 60000,
  // Run E2E tests sequentially to avoid database conflicts
  maxWorkers: 1,
};

export default config;
