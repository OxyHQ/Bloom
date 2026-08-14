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
  // Agent git worktrees. Each is a full checkout of this repo, so jest-haste-map
  // finds a SECOND copy of every file in `__mocks__/` ("duplicate manual mock
  // found") and may resolve the stale one — which fails the suite, or worse
  // passes it against mocks that no longer match the source.
  //
  // BOTH locations are listed. Worktrees moved from `.claude/worktrees/` to
  // `.worktrees/` and the pattern did not follow, so a run in the shared
  // checkout collected 1197 test files out of other agents' branches — every
  // sibling's work-in-progress, reported as this checkout's result. It fails in
  // the permissive direction: the run is greener and far larger than the tree
  // under test, and nothing about the output says so.
  modulePathIgnorePatterns: ['<rootDir>/.claude/', '<rootDir>/.worktrees/'],
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
    'react-native-screens': '<rootDir>/__mocks__/react-native-screens.ts',
    '^expo-haptics$': '<rootDir>/__mocks__/expo-haptics.ts',
    '^expo-blur$': '<rootDir>/__mocks__/expo-blur.ts',
    '^expo-image$': '<rootDir>/__mocks__/expo-image.ts',
    '^expo-glass-effect$': '<rootDir>/__mocks__/expo-glass-effect.ts',
    '^expo-symbols$': '<rootDir>/__mocks__/expo-symbols.ts',
    '^react-native$': '<rootDir>/__mocks__/react-native.ts',
    '\\.(woff2?|ttf|otf|eot)$': '<rootDir>/__mocks__/font-asset.ts',
  },
  setupFiles: ['<rootDir>/__mocks__/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native-web|@react-native|expo-linear-gradient))',
  ],
};

export default config;
