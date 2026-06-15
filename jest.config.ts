import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          strict: true,
          noUncheckedIndexedAccess: true,
          skipLibCheck: true,
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx)'],
  moduleNameMapper: {
    // react-native-css is a transitive (host-only) dep; `theme/native-root-vars.ts`
    // statically imports its `native-internal` subpath. Map it so suites that pull
    // `BloomThemeProvider` resolve. Suites asserting exact `.set` calls override
    // this with a virtual `jest.doMock` inside `jest.isolateModules`.
    '^react-native-css/native-internal$':
      '<rootDir>/__mocks__/react-native-css-native-internal.ts',
    'react-native-reanimated': '<rootDir>/__mocks__/react-native-reanimated.ts',
    'react-native-gesture-handler': '<rootDir>/__mocks__/react-native-gesture-handler.ts',
    'react-native-safe-area-context': '<rootDir>/__mocks__/react-native-safe-area-context.ts',
    'react-native-keyboard-controller': '<rootDir>/__mocks__/react-native-keyboard-controller.ts',
    '^react-native-svg$': '<rootDir>/__mocks__/react-native-svg.ts',
    '^react-native$': '<rootDir>/__mocks__/react-native.ts',
    '\\.(woff2?|ttf|otf|eot)$': '<rootDir>/__mocks__/font-asset.ts',
  },
  setupFiles: ['<rootDir>/__mocks__/setup.ts'],
};

export default config;
