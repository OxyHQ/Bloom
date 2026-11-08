import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const hash = (value) => createHash('sha256').update(value).digest('hex');
const apk = resolve(process.env.APK || 'android/app/build/outputs/apk/release/app-release.apk');
const build = JSON.parse(readFileSync('build.json', 'utf8'));
const bundle = execFileSync('unzip', ['-p', apk, 'assets/index.android.bundle'], {
  maxBuffer: 256 * 1024 * 1024,
});
for (const key of ['commit', 'nativeSha256', 'adapterSha256', 'lockSha256'])
  assert(bundle.includes(build[key]), `Stale metadata: ${key}`);
if (build.nativeSourcesSha256) {
  const digest = createHash('sha256');
  for (const name of ['BloomPackage.kt', 'ComposerLight.kt', 'ComposerLightSnapshot.kt'])
    digest
      .update(name)
      .update(readFileSync(resolve(build.installed, 'android/src/main/java/so/oxy/bloom', name)));
  assert.equal(digest.digest('hex'), build.nativeSourcesSha256);
  assert(bundle.includes(build.nativeSourcesSha256), 'Stale native source receipt');
}
if (build.fixtureSha256) assert(bundle.includes(build.fixtureSha256), 'Stale fixture receipt');
assert(
  bundle.equals(
    readFileSync('android/app/build/generated/assets/react/release/index.android.bundle'),
  ),
  'APK bundle differs from generated bundle',
);
const map = JSON.parse(
  readFileSync(
    'android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.packager.map',
    'utf8',
  ),
);
const sources = new Map();
const fixtureSources = new Map();
const aliaSources = new Map();
function collect(map) {
  if (map.sections) {
    for (const section of map.sections) collect(section.map);
    return;
  }
  for (let i = 0; i < map.sources.length; i++) {
    const prefix = '/bloom-local/node_modules/@oxy.so/bloom/';
    const aliaPrefix = '/node_modules/@alia.onl/sdk/';
    const aliaAt = map.sources[i].indexOf(aliaPrefix);
    if (aliaAt >= 0 && /\.(?:[cm]?[jt]sx?|json)$/.test(map.sources[i]))
      aliaSources.set(map.sources[i].slice(aliaAt + aliaPrefix.length), map.sourcesContent[i]);
    if (
      [
        '/PackageLab.tsx',
        '/LoaderBenchmark.tsx',
        '/ComposerCases.tsx',
        '/RawInputCases.tsx',
        '/AliaCases.tsx',
      ].includes(map.sources[i])
    )
      fixtureSources.set(map.sources[i].slice(1), map.sourcesContent[i]);
    if (map.sources[i].startsWith(prefix) && /\.(?:[cm]?[jt]sx?|json)$/.test(map.sources[i]))
      sources.set(map.sources[i].slice(prefix.length), map.sourcesContent[i]);
    assert(!map.sources[i].startsWith('/../../src/'), 'Checkout source bypasses installed package');
  }
}
collect(map);
for (const name of [
  'PackageLab.tsx',
  'LoaderBenchmark.tsx',
  'ComposerCases.tsx',
  'RawInputCases.tsx',
  'AliaCases.tsx',
])
  assert.equal(
    fixtureSources.get(name),
    readFileSync(name, 'utf8'),
    `Stale fixture source: ${name}`,
  );
const embeddedFixtureSources = Object.fromEntries(
  [...fixtureSources].map(([name, content]) => [name, hash(content)]),
);
assert(sources.has('src/composer-loader/AndroidLight.tsx'), 'Adapter not in installed bundle');
assert(aliaSources.has('src/components/AliaComposer.tsx'), 'Real AliaComposer missing from bundle');
const aliaDigest = createHash('sha256');
for (const [name, content] of [...aliaSources].sort(([a], [b]) => a.localeCompare(b))) {
  assert.equal(
    content,
    readFileSync(resolve(build.alia.installed, name), 'utf8'),
    `Stale Alia source: ${name}`,
  );
  aliaDigest.update(name).update(content);
}
assert.equal(hash(aliaSources.get('src/components/AliaComposer.tsx')), build.alia.composerSha256);
const digest = createHash('sha256');
for (const [name, content] of [...sources].sort(([a], [b]) => a.localeCompare(b))) {
  assert.equal(
    content,
    readFileSync(resolve(build.installed, name), 'utf8'),
    `Stale installed source: ${name}`,
  );
  digest.update(name).update(content);
}
assert.equal(
  hash(
    readFileSync(resolve(build.installed, 'android/src/main/java/so/oxy/bloom/ComposerLight.kt')),
  ),
  build.nativeSha256,
);
const entries = execFileSync('unzip', ['-Z1', apk], { encoding: 'utf8' })
  .split('\n')
  .filter((name) => /^classes\d*\.dex$/.test(name));
const mapping = readFileSync('android/app/build/outputs/mapping/release/mapping.txt', 'utf8');
const mappedClass = mapping.match(/^so\.oxy\.bloom\.ComposerLight -> ([^:]+):$/m)?.[1];
assert(mappedClass, 'Native implementation missing from R8 mapping');
let nativeContract = false;
let nativeImplementation = false;
let selectionTraceProbe = false;
const dex = entries.map((name) => {
  const data = execFileSync('unzip', ['-p', apk, name], { maxBuffer: 64 * 1024 * 1024 });
  if (data.includes('BloomComposerLightV1')) nativeContract = true;
  if (data.includes('BloomSelectionTrace')) selectionTraceProbe = true;
  if (data.includes(`L${mappedClass.replaceAll('.', '/')};`)) nativeImplementation = true;
  return { name, sha256: hash(data) };
});
assert(
  nativeContract && nativeImplementation,
  'Versioned native implementation is absent from APK DEX',
);
assert(selectionTraceProbe, 'Diagnostic selection probe absent from native binary');
writeFileSync(
  'attestation.json',
  JSON.stringify(
    {
      ...build,
      packedTarballSha256: readFileSync('bloom-local/.built-sha256', 'utf8'),
      apkSha256: hash(readFileSync(apk)),
      embeddedBundleSha256: hash(bundle),
      embeddedBloomSourceSha256: digest.digest('hex'),
      embeddedBloomFiles: sources.size,
      embeddedAliaSourceSha256: aliaDigest.digest('hex'),
      embeddedAliaFiles: aliaSources.size,
      embeddedFixtureSources,
      selectionTraceProbe,
      dex,
      r8MappingSha256: hash(mapping),
      mappedNativeClass: mappedClass,
      nativeEvidence:
        'compiled installed Kotlin input hash, DEX contract marker and full DEX hashes; no runtime source receipt',
    },
    null,
    2,
  ),
);
console.log(`Attested installed package: ${sources.size} bundled files and native DEX contract`);
