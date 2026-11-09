import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve('../..');
const installed = realpathSync('node_modules/@oxy.so/bloom');
const installedPackage = JSON.parse(readFileSync(resolve(installed, 'package.json')));
const npmTarball = process.env.BLOOM_NPM_TARBALL;
const npmIntegrity = process.env.BLOOM_NPM_INTEGRITY;
const npmVersion = process.env.BLOOM_NPM_VERSION;
if (npmTarball || npmIntegrity || npmVersion) {
  if (!npmTarball || !npmIntegrity || !npmVersion)
    throw new Error(
      'Published-package evidence needs BLOOM_NPM_TARBALL, BLOOM_NPM_INTEGRITY and BLOOM_NPM_VERSION',
    );
  const integrity = `sha512-${createHash('sha512')
    .update(readFileSync(resolve(npmTarball)))
    .digest('base64')}`;
  if (integrity !== npmIntegrity)
    throw new Error('npm tarball integrity does not match the registry');
  if (installedPackage.version !== npmVersion)
    throw new Error(
      `Installed @oxy.so/bloom@${installedPackage.version}; expected published ${npmVersion}`,
    );
}
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
  'ComposerCases.tsx',
  'RawInputControl.tsx',
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
      kind: npmIntegrity
        ? 'published npm tarball'
        : 'local packed snapshot; not published acceptance',
      ...(npmIntegrity ? { npmIntegrity } : {}),
      installed,
      packageVersion: JSON.parse(readFileSync(resolve(installed, 'package.json'))).version,
      nativeSha256: hash(native),
      nativeSourcesSha256: nativeDigest.digest('hex'),
      adapterSha256: hash(adapter),
      lockSha256: hash(readFileSync('bun.lock')),
      reactCompiler: false,
      scene: process.env.BLOOM_LAB_SCENE || 'benchmark',
      softwareWindow: process.env.BLOOM_LAB_SOFTWARE_WINDOW === '1',
    },
    null,
    2,
  ),
);
