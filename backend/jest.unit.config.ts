import type { Config } from 'jest';
import baseConfig from './jest.config';

const config: Config = {
  ...baseConfig,
  displayName: 'unit',
  testMatch: ['<rootDir>/tests/unit/**/*.spec.ts'],
  coverageDirectory: './coverage/unit',
  collectCoverageFrom: [
    'src/domain/**/*.(t|j)s',
    'src/application/**/*.(t|j)s',
    'src/infrastructure/services/**/*.(t|j)s',
    'src/presentation/controllers/**/*.(t|j)s',
    'src/auth/**/*.(t|j)s',
    'src/mail/**/*.(t|j)s',
    'src/listener/**/*.(t|j)s',
    'src/common/filters/**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/*.interface.ts',
    '!**/*.enum.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};

export default config;
