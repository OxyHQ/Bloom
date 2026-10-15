/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          esModuleInterop: true,
          strict: true,
          noUncheckedIndexedAccess: true,
          skipLibCheck: true,
        },
      },
    ],
  },
  // Test against the sibling package's source, not its last build.
  moduleNameMapper: {
    '^@oxy.so/bloom-text/model$': '<rootDir>/../bloom-text/src/model.ts',
    '^@oxy.so/bloom-text$': '<rootDir>/../bloom-text/src/index.ts',
  },
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
};
