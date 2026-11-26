/**
 * The codemod's suites.
 *
 * - `unit`: the class resolver and the transform, in Node.
 * - `parity native` / `parity web`: every corpus fixture (the before JSX and
 *   the after chain the codemod wrote) rendered through the language's parity
 *   harness (`packages/bloom-language/parity/support`), the before side
 *   through NativeWind's own runtime (react-native-css) and the app's compiled
 *   Tailwind stylesheet.
 */
const { join } = require('node:path');
const parity = require('../bloom-language/parity/jest.config.js');

const HERE = __dirname;
const RNCSS = join(HERE, '../../node_modules/react-native-css');

/** NativeWind's runtime, from its source: the native files on native, the web ones on the web. */
const css = (platform) => ({
  '^react-native-css$': `${RNCSS}/src/${platform === 'native' ? 'runtime.native.ts' : 'runtime.ts'}`,
  '^react-native-css/native-internal$': `${RNCSS}/src/native-internal/index.ts`,
  '^react-native-css/web$': `${RNCSS}/src/web/index.ts`,
  '^react-native-css/components/(.*)$': `${RNCSS}/src/components/$1`,
  '^react-native-css/compiler$': `${RNCSS}/dist/commonjs/compiler/index.js`,
});

const [native, web] = parity.projects;
/** A corpus the CLI wrote outside the repository resolves its imports from the repository's. */
const modulePaths = [join(HERE, '../../node_modules')];

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      rootDir: HERE,
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            tsconfig: {
              module: 'commonjs',
              esModuleInterop: true,
              strict: true,
              skipLibCheck: true,
              jsx: 'react-jsx',
            },
          },
        ],
      },
      testMatch: ['<rootDir>/src/**/__tests__/*.test.ts'],
    },
    {
      ...native,
      displayName: 'parity native',
      modulePaths,
      setupFiles: [...native.setupFiles, `${HERE}/parity/support/native-setup.ts`],
      moduleNameMapper: { ...native.moduleNameMapper, ...css('native') },
      transformIgnorePatterns: [
        'node_modules/(?!(react-native-web|@react-native|expo-linear-gradient|expo-video|three|react-native-css))',
      ],
      testMatch: [`${HERE}/parity/*.parity.test.tsx`],
    },
    {
      ...web,
      displayName: 'parity web',
      modulePaths,
      moduleNameMapper: { ...web.moduleNameMapper, ...css('web') },
      transformIgnorePatterns: [
        'node_modules/(?!(react-native-web|@react-native|expo-linear-gradient|expo-video|three|react-native-css))',
      ],
      testMatch: [`${HERE}/parity/*.parity.web.test.tsx`],
    },
  ],
};
