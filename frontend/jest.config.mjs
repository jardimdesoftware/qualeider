import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  coveragePathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  // A cobertura mede a camada de lógica do frontend (hooks, serviços, schemas
  // e utilitários). As telas (app/ e components/) ainda não entram na conta.
  collectCoverageFrom: [
    "src/{hooks,lib,schemas,services,utils}/**/*.{ts,tsx}",
    "!src/**/__tests__/**",
    "!src/**/*.d.ts",
  ],
  coverageReporters: ["text", "text-summary", "json-summary", "lcov"],
  coverageThreshold: {
    global: { statements: 70, branches: 70, functions: 70, lines: 70 },
  },
};

export default createJestConfig(config);
