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
  // Component suites render on the web, so a module's web fork is the one
  // they load (`paste-capture.web.ts` over the native no-op beside it).
  moduleFileExtensions: ['web.tsx', 'web.ts', 'tsx', 'ts', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    // Test against the sibling package's source, not its last build.
    '^@oxy.so/bloom-text/model$': '<rootDir>/../bloom-text/src/model.ts',
    '^@oxy.so/bloom-text$': '<rootDir>/../bloom-text/src/index.ts',
    // Component suites render on the web (jsdom): React Native is
    // react-native-web, and the platform text input a stand-in (jsdom has no
    // editing surface). One React for both packages' sources.
    '^react-native$': 'react-native-web',
    '^react-native-enriched-html$': '<rootDir>/src/react/__tests__/support/enriched-input.tsx',
    '^react$': require.resolve('react'),
    '^react/(.*)$': `${require('node:path').dirname(require.resolve('react/package.json'))}/$1`,
    '^react-dom$': require.resolve('react-dom'),
    '^react-dom/(.*)$': `${require('node:path').dirname(require.resolve('react-dom/package.json'))}/$1`,
  },
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'],
};
