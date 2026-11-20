/** @type {import('jest').Config} */
const support = `${__dirname}/src/__tests__/support`;
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
  // The renderer is tested against React Native as plain host names, and
  // Bloom's token tables are read from Bloom's own source (not copies), so a
  // token suite fails when a Bloom rung moves. Bloom's components are named
  // stand-ins: what reaches them is the prop contract under test.
  moduleNameMapper: {
    '^react-native$': `${support}/react-native.ts`,
    '^react-native-css$': `${support}/react-native-css.ts`,
    '^@oxy.so/bloom/styles$': `${support}/bloom-styles.ts`,
    '^@oxy.so/bloom/typography$': `${support}/bloom-typography.ts`,
    '^@oxy.so/bloom/icons/shared$': `${support}/bloom-icons.ts`,
    '^@oxy.so/bloom/avatar$': `${support}/bloom-avatar.ts`,
    '^@oxy.so/bloom/theme$': `${support}/bloom-theme.ts`,
    '^@oxy.so/bloom/(button|engagement-bar|shapes|surface)$': `${support}/bloom-components.ts`,
    '^react$': require.resolve('react'),
    '^react/(.*)$': `${require('node:path').dirname(require.resolve('react/package.json'))}/$1`,
  },
  rootDir: __dirname,
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'],
};
