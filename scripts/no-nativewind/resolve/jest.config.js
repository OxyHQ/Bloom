// The class resolver (resolve.sh) runs in the BASELINE checkout, which still has NativeWind.
const { join } = require('node:path');
const BASE = process.env.BLOOM_BASELINE;
const root = require(join(BASE, 'jest.config.ts')).default;
module.exports = {
  ...root,
  rootDir: BASE,
  roots: [BASE + '/src', __dirname],
  testMatch: [join(__dirname, '*.resolve.test.tsx')],
  modulePathIgnorePatterns: [],
  moduleDirectories: ['node_modules', join(BASE, 'node_modules')],
  moduleNameMapper: {
    ...root.moduleNameMapper,
    '^react-native-css$': join(
      BASE,
      'node_modules/react-native-css/dist/commonjs/runtime.native.js',
    ),
    '^react$': join(BASE, 'node_modules/react'),
    '^react/(.*)$': join(BASE, 'node_modules/react/$1'),
    '^react-test-renderer$': join(BASE, 'node_modules/react-test-renderer'),
    '^react-native-css/native-internal$': join(
      BASE,
      'node_modules/react-native-css/dist/commonjs/native-internal/index.js',
    ),
  },
};
