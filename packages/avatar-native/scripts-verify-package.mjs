/** Verify the archive as consumers receive it. Packing must never rebuild. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
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
  'lib/runtime-revision.cjs',
  'lib/runtime-revision.d.cts',
  'src/index.ts',
  'src/NativeAvatar.tsx',
  'src/pool.ts',
  'android/build.gradle',
  'android/src/main/java/so/oxy/bloom/avatargpu/AvatarGPUModule.kt',
  'expo-module.config.json',
  'LICENSE',
  'README.md',
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
const expectedRevision = createHash('sha256')
  .update(readFileSync(resolve(directory, 'lib/asset-manifest.json')))
  .digest('hex');
assert.equal(
  createHash('sha256')
    .update(readFileSync(resolve(directory, '../../assets/character-runtime/manifest.json')))
    .digest('hex'),
  expectedRevision,
  'Hosted manifest bytes must be identical, not reserialized JSON',
);
// Resolve the public neutral subpath from the actual archive, with no RN peers.
const extracted = mkdtempSync(resolve(destination, 'verify-'));
try {
  const packageDirectory = resolve(extracted, 'node_modules/@oxy.so/bloom-avatar-native');
  mkdirSync(packageDirectory, { recursive: true });
  execFileSync('tar', [
    '-xzf',
    resolve(destination, pack.filename),
    '--strip-components=1',
    '-C',
    packageDirectory,
  ]);
  const require = createRequire(resolve(extracted, 'consumer.cjs'));
  assert.equal(
    require('@oxy.so/bloom-avatar-native/runtime-revision').AVATAR_RUNTIME_REVISION,
    expectedRevision,
  );
  const imported = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      "import { AVATAR_RUNTIME_REVISION } from '@oxy.so/bloom-avatar-native/runtime-revision'; process.stdout.write(AVATAR_RUNTIME_REVISION)",
    ],
    { cwd: extracted, encoding: 'utf8' },
  );
  assert.equal(imported, expectedRevision);
} finally {
  rmSync(extracted, { recursive: true, force: true });
}
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
