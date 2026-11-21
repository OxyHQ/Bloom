/**
 * The component parity suite: each language node rendered beside the Bloom
 * component it stands for, under Bloom's real provider, through Bloom's own
 * test environment (its React Native and native-module mocks, read from the
 * repository root), and compared host for host.
 *
 * The runtime's own suite (`../jest.config.js`) tests the language against
 * named stand-ins of Bloom; this one renders Bloom itself, so a difference in
 * what either side draws fails here.
 *
 * - native: React Native's hosts as Bloom's mock names them, each module's
 *   Android file, then its native file, then its default, as Metro resolves
 *   them for Android (OxyOS takes them too), compared as committed trees.
 * - web: react-native-web in jsdom, compared as DOM elements and the CSS that
 *   reaches each one.
 */
const { join } = require('node:path');

// Bloom's own test environment, as its root config defines it (Node strips its types).
const root = require('../../../jest.config.ts').default;

const BLOOM = join(__dirname, '../../..');
const PACKAGE = join(__dirname, '..');

const rootMapper = root.moduleNameMapper;

/** Bloom's subpaths as its source, as the language's devDependency on `file:../..` resolves them. */
const bloomSource = {
  '^@oxy.so/bloom-language$': `${PACKAGE}/src/index.ts`,
  '^@oxy.so/bloom/icons/(Ri[A-Za-z0-9]+)$': '<rootDir>/src/icons/remix/$1',
  '^@oxy.so/bloom/icons/(SiSubstack)$': '<rootDir>/src/icons/simple-icons/$1',
  '^@oxy.so/bloom/icons/([A-Za-z]+Icon)$': '<rootDir>/src/icons/social/$1',
  '^@oxy.so/bloom/(.*)$': '<rootDir>/src/$1',
  // Optional native peers of the language: absent, as in an app without them.
  '^(expo|expo-glass-effect|expo-router|@expo/ui/swift-ui/modifiers)$': `${PACKAGE}/src/__tests__/support/absent/$1.ts`,
  '^@expo/ui/swift-ui$': `${PACKAGE}/src/__tests__/support/absent/@expo/ui/swift-ui/index.ts`,
};

/** @type {import('jest').Config} */
const shared = {
  ...root,
  rootDir: BLOOM,
  // The root ignores every package; this suite needs the language's own source.
  modulePathIgnorePatterns: [
    '<rootDir>/.claude/',
    '<rootDir>/.worktrees/',
    '<rootDir>/.local/',
    '<rootDir>/packages/bloom-(text|editor|lens|language-compiler)/',
    '<rootDir>/packages/bloom-language/lib/',
  ],
  setupFiles: [...root.setupFiles],
};

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      ...shared,
      displayName: 'parity native',
      moduleFileExtensions: [
        'android.tsx',
        'android.ts',
        'native.tsx',
        'native.ts',
        ...root.moduleFileExtensions,
      ],
      moduleNameMapper: {
        ...bloomSource,
        '^expo-font$': `${PACKAGE}/parity/support/expo-font.ts`,
        ...rootMapper,
      },
      setupFiles: [...shared.setupFiles, `${PACKAGE}/parity/support/android.ts`],
      testMatch: ['<rootDir>/packages/bloom-language/parity/*.parity.test.tsx'],
    },
    {
      ...shared,
      displayName: 'parity web',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['web.tsx', 'web.ts', ...root.moduleFileExtensions],
      moduleNameMapper: { ...bloomSource, ...rootMapper },
      setupFiles: [...shared.setupFiles, `${PACKAGE}/parity/support/web-setup.ts`],
      testMatch: ['<rootDir>/packages/bloom-language/parity/*.parity.web.test.tsx'],
    },
  ],
};
