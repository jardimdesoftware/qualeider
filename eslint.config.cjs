const parser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ["src/**/*.ts", "apps/**/*.ts", "libs/**/*.ts", "test/**/*.ts"],
    languageOptions: {
      parser,
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': {},
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    ignores: [
      "build/**",
      "coverage/**",
      "docs/!(src|tools)/",
      "docs/src/!(_data)",
      "jsdoc/**",
      "lib/types/**/*.ts",
      "templates/**",
      "tests/bench/**",
      "tests/fixtures/**",
      "tests/performance/**",
      "tmp/**",
      "**/test.js",
      ".vscode",
    ],
  },
  {
    files: ["tools/*.js", "docs/tools/*.js"],
    rules: {
      "no-console": "off",
      "n/no-process-exit": "off",
    },
  },
  {
    files: ["lib/rules/*.js", "tools/internal-rules/*.js"],
    ignores: ["**/index.js"],
    rules: {
      "eslint-plugin/report-message-format": ["error", "[^a-z].*\\.$"],
      "eslint-plugin/require-meta-docs-description": ["error", { pattern: "^(Enforce|Require|Disallow) .+[^. ]$" }],
    },
  },
];