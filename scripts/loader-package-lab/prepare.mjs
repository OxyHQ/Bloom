import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve('../..');
const installed = realpathSync('node_modules/@oxy.so/bloom');
const native = readFileSync(
  resolve(installed, 'android/src/main/java/so/oxy/bloom/ComposerLight.kt'),
);
const nativeDigest = createHash('sha256');
for (const name of ['BloomPackage.kt', 'ComposerLight.kt', 'ComposerLightSnapshot.kt'])
  nativeDigest
    .update(name)
    .update(readFileSync(resolve(installed, 'android/src/main/java/so/oxy/bloom', name)));
const adapter = readFileSync(resolve(installed, 'src/composer-loader/AndroidLight.tsx'));
if (!native.includes('BloomComposerLightV1') || !adapter.includes('BloomComposerLightV1'))
  throw new Error('Missing candidate marker');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const fixtureDigest = createHash('sha256');
for (const name of [
  'PackageLab.tsx',
  'LoaderBenchmark.tsx',
  'app.config.js',
  'index.js',
  'metro.config.js',
  'babel.config.js',
  'global.css',
  'without-network.js',
  'software-canvas-probe.js',
  'software-window.js',
  'package.json',
  'bun.lock',
])
  fixtureDigest.update(name).update(readFileSync(name));
writeFileSync(
  'build.json',
  JSON.stringify(
    {
      commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
      workingTree: execFileSync('git', ['status', '--porcelain'], {
        cwd: root,
        encoding: 'utf8',
      }).trim(),
      fixtureSha256: fixtureDigest.digest('hex'),
      packedTarballSha256: readFileSync('bloom-local/.built-sha256', 'utf8'),
      kind: 'local packed snapshot; not published acceptance',
      installed,
      packageVersion: JSON.parse(readFileSync(resolve(installed, 'package.json'))).version,
      nativeSha256: hash(native),
      nativeSourcesSha256: nativeDigest.digest('hex'),
      adapterSha256: hash(adapter),
      lockSha256: hash(readFileSync('bun.lock')),
      reactCompiler: false,
      softwareWindow: process.env.BLOOM_LAB_SOFTWARE_WINDOW === '1',
    },
    null,
    2,
  ),
);
