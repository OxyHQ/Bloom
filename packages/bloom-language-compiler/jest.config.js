/**
 * The parity suite: every fixture rendered interpreted and compiled, on native
 * and web, through the runtime's own test setup (its host stand-ins and the
 * Bloom tables read from Bloom's source). `.bloom` modules go through this
 * package's Jest transformer, as an app's would:
 *
 * ```js
 * moduleFileExtensions: ['bloom', ...],
 * transform: { '\\.bloom$': ['@oxy.so/bloom-language-compiler/jest', { upstream: ['babel-jest', babelOptions] }] },
 * ```
 *
 * with Babel options that parse TypeScript and give Jest CommonJS.
 */
const path = require('node:path');
const runtime = require('../bloom-language/jest.config.js');

const BLOOM_BABEL = {
  babelrc: false,
  configFile: false,
  presets: [require.resolve('@babel/preset-typescript')],
  plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
};

/** @type {import('jest').Config} */
module.exports = {
  ...runtime,
  rootDir: __dirname,
  // The crates hold the core's own snapshots (`*.snap`), which are not Jest's.
  roots: ['<rootDir>/test'],
  testMatch: ['<rootDir>/test/**/*.test.ts?(x)'],
  moduleFileExtensions: [...runtime.moduleFileExtensions, 'bloom'],
  transform: {
    ...runtime.transform,
    '\\.bloom$': [
      path.join(__dirname, 'js/jest.js'),
      { upstream: [require.resolve('babel-jest'), BLOOM_BABEL] },
    ],
  },
  moduleNameMapper: {
    ...runtime.moduleNameMapper,
    '^@oxy.so/bloom-language$': path.join(__dirname, '../bloom-language/src/index.ts'),
    '^@oxy.so/bloom-language/router$': path.join(
      __dirname,
      '../bloom-language/src/router/index.ts',
    ),
    '^@oxy.so/bloom-language/([a-z-]+)$': path.join(
      __dirname,
      '../bloom-language/src/entries/$1.ts',
    ),
    // The data layer under the standard library's `@Model` (stdlib/Bloom/models.ts), from source.
    '^@oxy.so/bloom-data$': path.join(__dirname, '../bloom-data/src/index.ts'),
  },
};
