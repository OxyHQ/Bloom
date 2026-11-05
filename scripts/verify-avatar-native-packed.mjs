#!/usr/bin/env node
/** Independent installed-artifact audit; does not install or modify packages. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const app = resolve(process.argv[2] ?? '.');
const requireFromApp = createRequire(resolve(app, 'package.json'));
const root = dirname(requireFromApp.resolve('@oxy.so/bloom/package.json'));
const metadata = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const oldPackage = '@oxy.so/bloom-avatar-native';
for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'])
  assert.equal(metadata[field]?.[oldPackage], undefined, `${field} retains the standalone package`);
assert.throws(() => requireFromApp.resolve(`${oldPackage}/package.json`), {
  code: 'MODULE_NOT_FOUND',
});
const config = JSON.parse(await readFile(resolve(root, 'expo-module.config.json'), 'utf8'));
assert.deepEqual(config.android.modules, ['so.oxy.bloom.avatargpu.AvatarGPUModule']);
assert.deepEqual(requireFromApp(resolve(root, 'react-native.config.js')).dependency.platforms, {
  android: null,
  ios: null,
});

const specifier = '@oxy.so/bloom/agent-avatar/runtime-revision';
const entry = requireFromApp.resolve(specifier);
const before = new Set(Object.keys(requireFromApp.cache));
const cjs = requireFromApp(specifier);
const esm = await import(pathToFileURL(entry).href);
assert.equal(esm.AVATAR_RUNTIME_REVISION, cjs.AVATAR_RUNTIME_REVISION);
const loaded = Object.keys(requireFromApp.cache).filter((file) => !before.has(file));
assert.deepEqual(loaded, [entry], 'Neutral revision import must not load React Native or Expo');
const webManifest = await readFile(resolve(root, 'assets/character-runtime/manifest.json'));
const nativeManifest = await readFile(
  resolve(root, 'src/agent-avatar/native/generated/asset-manifest.json'),
);
assert.deepEqual(nativeManifest, webManifest);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256(webManifest), cjs.AVATAR_RUNTIME_REVISION);
const manifest = JSON.parse(webManifest);
for (const [name, hash] of Object.entries(manifest.files)) {
  assert(!name.split('/').includes('..'), 'Manifest path escapes its root');
  assert.equal(sha256(await readFile(resolve(root, 'assets/character-runtime', name))), hash, name);
}
const factoryPath = resolve(root, 'src/agent-avatar/native/generated/runtime.cjs');
assert.equal(typeof requireFromApp(factoryPath), 'function');
let gl;
try {
  gl = JSON.parse(await readFile(requireFromApp.resolve('expo-gl/package.json'), 'utf8')).version;
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
  gl = null;
}
if (process.argv.includes('--without-gl'))
  assert.equal(gl, null, 'Negative fixture still resolves expo-gl');
if (process.argv.includes('--with-gl')) assert.equal(gl, '58.0.3');
console.log(
  JSON.stringify(
    {
      package: metadata.name,
      version: metadata.version,
      root: await realpath(root),
      revision: cjs.AVATAR_RUNTIME_REVISION,
      filesVerified: Object.keys(manifest.files).length,
      nativeFactorySHA256: sha256(await readFile(factoryPath)),
      expoGL: gl,
      neutralModulesLoaded: loaded.length,
      standaloneAbsent: true,
    },
    null,
    2,
  ),
);
