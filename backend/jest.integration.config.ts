import type { Config } from 'jest';
import baseConfig from './jest.config';

const config: Config = {
  ...baseConfig,
  displayName: 'integration',
  testMatch: ['<rootDir>/tests/integration/**/*.spec.ts'],
  coverageDirectory: './coverage/integration',
  collectCoverageFrom: [
    'src/infrastructure/repositories/**/*.(t|j)s',
    'src/infrastructure/prisma/**/*.(t|j)s',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  // Integration tests may take longer
  testTimeout: 30000,
};

export default config;
