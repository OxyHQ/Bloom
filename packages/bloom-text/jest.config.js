/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // The DOM suites and their renderer must resolve the same React instance.
  moduleNameMapper: {
    '^react$': require.resolve('react', { paths: [require.resolve('react-dom')] }),
    '^react/(.*)$': `${require('node:path').dirname(require.resolve('react/package.json', { paths: [require.resolve('react-dom')] }))}/$1`,
  },
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
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
};
