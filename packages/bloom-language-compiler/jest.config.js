/**
 * The parity suite: every fixture rendered interpreted and compiled, on native
 * and web, through the runtime's own test setup (its host stand-ins and the
 * Bloom tables read from Bloom's source).
 */
const path = require('node:path');
const runtime = require('../bloom-language/jest.config.js');

/** @type {import('jest').Config} */
module.exports = {
  ...runtime,
  rootDir: __dirname,
  testMatch: ['<rootDir>/test/**/*.test.ts?(x)'],
  moduleNameMapper: {
    ...runtime.moduleNameMapper,
    '^@oxy.so/bloom-language$': path.join(__dirname, '../bloom-language/src/index.ts'),
  },
};
