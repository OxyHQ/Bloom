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

/**
 * The before side's Bloom: Bloom 22 (`bloom-22`, the last Bloom that took
 * `className`), from the source its package ships, as the language's suite maps
 * this checkout's Bloom to its source. Transpiled only: its types are Bloom 22's,
 * checked when it was released, not against this checkout's dependencies.
 */
const BLOOM_22 = join(HERE, '../../node_modules/bloom-22/src');
const bloom22 = {
  '^bloom-22/icons/(Ri[A-Za-z0-9]+)$': `${BLOOM_22}/icons/remix/$1`,
  '^bloom-22/icons/(SiSubstack)$': `${BLOOM_22}/icons/simple-icons/$1`,
  '^bloom-22/icons/([A-Za-z]+Icon)$': `${BLOOM_22}/icons/social/$1`,
  '^bloom-22/(.*)$': `${BLOOM_22}/$1`,
};
const transpileBloom22 = (transform) => ({
  '^.+/node_modules/bloom-22/src/.+\\.tsx?$': [
    'ts-jest',
    {
      isolatedModules: true,
      diagnostics: false,
      tsconfig: {
        jsx: 'react-jsx',
        module: 'commonjs',
        esModuleInterop: true,
        skipLibCheck: true,
      },
    },
  ],
  ...transform,
});
const transformIgnorePatterns = [
  'node_modules/(?!(react-native-web|@react-native|expo-linear-gradient|expo-video|three|react-native-css|bloom-22))',
];

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
      moduleNameMapper: { ...bloom22, ...native.moduleNameMapper, ...css('native') },
      transform: transpileBloom22(native.transform),
      transformIgnorePatterns,
      testMatch: [`${HERE}/parity/*.parity.test.tsx`],
    },
    {
      ...web,
      displayName: 'parity web',
      modulePaths,
      moduleNameMapper: { ...bloom22, ...web.moduleNameMapper, ...css('web') },
      transform: transpileBloom22(web.transform),
      transformIgnorePatterns,
      testMatch: [`${HERE}/parity/*.parity.web.test.tsx`],
    },
  ],
};
