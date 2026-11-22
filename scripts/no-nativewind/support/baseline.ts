/**
 * The baseline's stylesheet: the Tailwind CSS an Oxy app compiles over Bloom's
 * source (`@oxy.so/app-preset/css/base.css`), compiled by react-native-css and
 * injected into its native runtime, as Metro does in an app.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const TREE = process.env.BLOOM_TREE as string;
// The one native the runtime touches at import time, absent from Bloom's React Native mock.
const rn = require('react-native') as { PlatformColor?: unknown };
rn.PlatformColor ??= (...names: string[]) => ({ semantic: names });
const css = execFileSync(process.execPath, [join(__dirname, 'tailwind-app.cjs'), TREE], {
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
});
// The runtime first: it creates the variable context native-internal reads at load.
require('react-native-css');
const { compile } = require(join(TREE, 'node_modules/react-native-css/dist/commonjs/compiler'));
const { StyleCollection } = require(
  join(TREE, 'node_modules/react-native-css/dist/commonjs/native-internal/index.js'),
);
StyleCollection.inject(compile(css, {}).stylesheet());
