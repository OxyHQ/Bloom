/** Verify the archive as consumers receive it. Packing must never rebuild. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const directory = dirname(fileURLToPath(import.meta.url));
const destination = resolve(directory, '../../.local/avatar-native-package');
mkdirSync(destination, { recursive: true });
const [pack] = JSON.parse(
  execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', destination], {
    cwd: directory,
    encoding: 'utf8',
  }),
);
const names = new Set(pack.files.map(({ path }) => path));
for (const required of [
  'lib/runtime.cjs',
  'lib/asset-manifest.json',
  'src/index.ts',
  'src/NativeAvatar.tsx',
  'src/pool.ts',
  'android/build.gradle',
  'android/src/main/java/so/oxy/bloom/avatargpu/AvatarGPUModule.kt',
  'expo-module.config.json',
])
  assert(names.has(required), `Missing ${required}`);
assert(
  ![...names].some(
    (name) =>
      name.includes('node_modules') || name.includes('.local/') || name.includes('__tests__'),
  ),
  'Archive contains development files',
);
const manifest = JSON.parse(readFileSync(resolve(directory, 'lib/asset-manifest.json'), 'utf8'));
assert(manifest.files['runtime.mjs']);
assert(Object.keys(manifest.files).some((name) => name.startsWith('chunks/')));
const webManifest = JSON.parse(
  readFileSync(resolve(directory, '../../assets/character-runtime/manifest.json'), 'utf8'),
);
assert.deepEqual(
  manifest,
  webManifest,
  'Native companion is stale: build:avatar-runtime then build:avatar-native from the same checkout before packing',
);
const factory = readFileSync(resolve(directory, 'lib/runtime.cjs'), 'utf8');
assert(!/import\.meta|document\.currentScript|data:application\/octet-stream|eval\(/.test(factory));
console.log(
  JSON.stringify({
    archive: resolve(destination, pack.filename),
    files: names.size,
    bytes: pack.size,
    unpackedBytes: pack.unpackedSize,
  }),
);
