import type { Config } from 'jest';
import baseConfig from './jest.config';

const config: Config = {
  ...baseConfig,
  displayName: 'e2e',
  testMatch: ['<rootDir>/tests/e2e/**/*.e2e.spec.ts'],
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
  testTimeout: 60000,
  // TODO: Implementar schemas isolados para permitir paralelização
  maxWorkers: 1,
};

export default config;
