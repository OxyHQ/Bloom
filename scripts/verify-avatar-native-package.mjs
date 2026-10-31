/** Verify the archive as consumers receive it. Packing must never rebuild. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const directory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = resolve(directory, '.local/avatar-native-package');
mkdirSync(destination, { recursive: true });
const [pack] = JSON.parse(
  execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', destination], {
    cwd: directory,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }),
);
const names = new Set(pack.files.map(({ path }) => path));
for (const required of [
  'src/agent-avatar/native/generated/runtime.cjs',
  'src/agent-avatar/native/generated/asset-manifest.json',
  'assets/character-native/runtime-revision.cjs',
  'assets/character-native/runtime-revision.d.cts',
  'src/agent-avatar/native/index.ts',
  'src/agent-avatar/native/NativeAvatar.tsx',
  'src/agent-avatar/native/pool.ts',
  'android/build.gradle',
  'android/src/gl/java/so/oxy/bloom/avatargpu/AvatarGPUModule.kt',
  'android/src/no-gl/java/so/oxy/bloom/avatargpu/AvatarGPUModule.kt',
  'react-native.config.js',
  'lib/module/agent-avatar/native/generated/runtime.cjs',
  'lib/commonjs/agent-avatar/native/generated/runtime.cjs',
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
const manifest = JSON.parse(
  readFileSync(resolve(directory, 'src/agent-avatar/native/generated/asset-manifest.json'), 'utf8'),
);
assert(manifest.files['runtime.mjs']);
assert(Object.keys(manifest.files).some((name) => name.startsWith('chunks/')));
const webManifest = JSON.parse(
  readFileSync(resolve(directory, 'assets/character-runtime/manifest.json'), 'utf8'),
);
assert.deepEqual(
  manifest,
  webManifest,
  'Native adapter is stale: build:avatar-runtime then build:avatar-native from the same checkout before packing',
);
const expectedRevision = createHash('sha256')
  .update(readFileSync(resolve(directory, 'src/agent-avatar/native/generated/asset-manifest.json')))
  .digest('hex');
assert.equal(
  createHash('sha256')
    .update(readFileSync(resolve(directory, 'assets/character-runtime/manifest.json')))
    .digest('hex'),
  expectedRevision,
  'Hosted manifest bytes must be identical, not reserialized JSON',
);
// Resolve the public neutral subpath from the actual archive, with no RN peers.
const extracted = mkdtempSync(resolve(destination, 'verify-'));
try {
  // A named consumer boundary prevents Node/TS self-reference resolution from
  // escaping this extracted archive into the enclosing Bloom checkout.
  writeFileSync(
    resolve(extracted, 'package.json'),
    JSON.stringify({ name: 'native-package-consumer', private: true }),
  );
  const packageDirectory = resolve(extracted, 'node_modules/@oxy.so/bloom');
  mkdirSync(packageDirectory, { recursive: true });
  execFileSync('tar', [
    '-xzf',
    resolve(destination, pack.filename),
    '--strip-components=1',
    '-C',
    packageDirectory,
  ]);
  const require = createRequire(resolve(extracted, 'consumer.cjs'));
  // Bob emits a deeper directory than Metro's src tree. Exercise each real
  // packed factory so an incorrect asset-relative path cannot pass packaging.
  for (const base of ['src', 'lib/commonjs', 'lib/module']) {
    const generated = resolve(packageDirectory, base, 'agent-avatar/native/generated');
    const createRuntime = require(resolve(generated, 'runtime.cjs'));
    assert.equal(typeof createRuntime, 'function');
    const runtime = createRuntime('https://assets.example.test/avatars/');
    assert.equal(typeof runtime.AuthoredAvatarEngine, 'function');
    assert.equal(typeof runtime.createAvatarSlotController, 'function');
    assert.equal(
      createHash('sha256')
        .update(readFileSync(resolve(generated, 'asset-manifest.json')))
        .digest('hex'),
      expectedRevision,
    );
  }
  assert.equal(
    require.resolve('@oxy.so/bloom/agent-avatar/runtime-revision'),
    resolve(packageDirectory, 'assets/character-native/runtime-revision.cjs'),
  );
  assert.equal(
    require('@oxy.so/bloom/agent-avatar/runtime-revision').AVATAR_RUNTIME_REVISION,
    expectedRevision,
  );
  const imported = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      "import { AVATAR_RUNTIME_REVISION } from '@oxy.so/bloom/agent-avatar/runtime-revision'; process.stdout.write(AVATAR_RUNTIME_REVISION)",
    ],
    { cwd: extracted, encoding: 'utf8' },
  );
  assert.equal(imported, expectedRevision);
  for (const moduleResolution of [
    ts.ModuleResolutionKind.Node10,
    ts.ModuleResolutionKind.NodeNext,
    ts.ModuleResolutionKind.Bundler,
  ]) {
    const resolved = ts.resolveModuleName(
      '@oxy.so/bloom/agent-avatar/runtime-revision',
      resolve(extracted, 'consumer.ts'),
      { moduleResolution },
      ts.sys,
    ).resolvedModule;
    assert.equal(
      resolved?.resolvedFileName,
      resolve(packageDirectory, 'assets/character-native/runtime-revision.d.cts'),
    );
  }
} finally {
  rmSync(extracted, { recursive: true, force: true });
}
const factory = readFileSync(
  resolve(directory, 'src/agent-avatar/native/generated/runtime.cjs'),
  'utf8',
);
assert(!/import\.meta|document\.currentScript|data:application\/octet-stream|eval\(/.test(factory));
console.log(
  JSON.stringify({
    archive: resolve(destination, pack.filename),
    files: names.size,
    bytes: pack.size,
    unpackedBytes: pack.unpackedSize,
  }),
);
