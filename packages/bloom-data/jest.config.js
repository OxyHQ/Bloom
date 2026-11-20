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
        diagnostics: { ignoreCodes: ['TS151001'] },
      },
    ],
  },
  moduleNameMapper: {
    '^react$': require.resolve('react'),
    '^react/(.*)$': `${require('node:path').dirname(require.resolve('react/package.json'))}/$1`,
  },
  rootDir: __dirname,
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'],
};
