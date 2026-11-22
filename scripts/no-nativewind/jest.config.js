/**
 * The no-NativeWind parity harness (docs/no-nativewind.mdx): every family's
 * cases (`cases/*.cases.tsx`) rendered on Android under Bloom's real provider,
 * light and dark, and written out as committed host trees with styles
 * flattened.
 *
 *   BLOOM_TREE=<checkout> PARITY_OUT=<dir> PARITY_BASELINE=1 jest -c scripts/no-nativewind/jest.config.js
 *
 * `BLOOM_TREE` is the checkout whose `src/` the cases import as `@bloom/*`.
 * With `PARITY_BASELINE=1` that checkout still styles with NativeWind:
 * react-native-css's native runtime resolves its classes from the Tailwind CSS
 * an app compiles over Bloom's source (`support/baseline.ts`). Without it the
 * tree is this branch, which has no NativeWind. `compare.mjs` diffs the two dumps.
 */
const { join } = require('node:path');

const HARNESS = __dirname;
const TREE = process.env.BLOOM_TREE ?? join(HARNESS, '..', '..');
const BASELINE = process.env.PARITY_BASELINE === '1';
const root = require(join(TREE, 'jest.config.ts')).default;
const RN_CSS = join(TREE, 'node_modules/react-native-css/dist/commonjs');

/** @type {import('jest').Config} */
module.exports = {
  ...root,
  rootDir: TREE,
  roots: [join(TREE, 'src'), HARNESS],
  testMatch: [join(HARNESS, 'parity.dump.test.tsx')],
  modulePathIgnorePatterns: ['<rootDir>/.worktrees/', '<rootDir>/packages/'],
  moduleDirectories: ['node_modules', join(TREE, 'node_modules')],
  moduleFileExtensions: ['android.tsx', 'android.ts', ...root.moduleFileExtensions],
  moduleNameMapper: {
    // The root's first, so the baseline's real runtime replaces its inert mock.
    ...root.moduleNameMapper,
    '^@bloom/(.*)$': join(TREE, 'src/$1'),
    // One React: the harness lives in this branch, the tree under test may not.
    '^react$': join(TREE, 'node_modules/react'),
    '^react/(.*)$': join(TREE, 'node_modules/react/$1'),
    '^react-test-renderer$': join(TREE, 'node_modules/react-test-renderer'),
    ...(BASELINE
      ? {
          '^react-native-css$': join(RN_CSS, 'runtime.native.js'),
          '^react-native-css/native-internal$': join(RN_CSS, 'native-internal/index.js'),
        }
      : {}),
  },
  setupFiles: [
    ...root.setupFiles,
    join(HARNESS, 'support/android.ts'),
    ...(BASELINE ? [join(HARNESS, 'support/baseline.ts')] : []),
  ],
};
