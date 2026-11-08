import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const apk = resolve(
  here,
  process.env.APK || 'android/app/build/outputs/apk/release/app-release.apk',
);
const build = JSON.parse(readFileSync(resolve(here, 'build.json'), 'utf8'));
const packed = execFileSync('unzip', ['-p', apk, 'assets/index.android.bundle'], {
  maxBuffer: 64 * 1024 * 1024,
});
for (const key of ['commit', 'fixtureSha256', 'sourceSha256', 'lockSha256']) {
  assert(packed.includes(Buffer.from(build[key])), `APK contains stale ${key}; rebuild the bundle`);
}
const emitted = readFileSync(
  resolve(here, 'android/app/build/generated/assets/react/release/index.android.bundle'),
);
assert(packed.equals(emitted), 'APK does not contain the emitted Hermes bundle');
const map = JSON.parse(
  readFileSync(
    resolve(
      here,
      'android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.packager.map',
    ),
    'utf8',
  ),
);
const sources = new Map();
function collect(map) {
  if (map.sections) for (const section of map.sections) collect(section.map);
  else
    for (let i = 0; i < map.sources.length; i++) {
      if (
        map.sources[i].startsWith('/../../src/') &&
        /\.(?:[cm]?[jt]sx?|json)$/.test(map.sources[i])
      )
        sources.set(map.sources[i].slice(7), map.sourcesContent[i]);
    }
}
collect(map);
assert(sources.size > 0, 'No Bloom source in emitted Metro source map');
const hash = createHash('sha256');
for (const [name, content] of [...sources].sort(([a], [b]) => a.localeCompare(b))) {
  assert.equal(
    content,
    readFileSync(resolve(root, name), 'utf8'),
    `Stale bundled Bloom source: ${name}`,
  );
  hash.update(name).update(content);
}
const report = {
  ...build,
  apkSha256: createHash('sha256').update(readFileSync(apk)).digest('hex'),
  embeddedBundleSha256: createHash('sha256').update(packed).digest('hex'),
  embeddedBloomSourceSha256: hash.digest('hex'),
  embeddedBloomFiles: sources.size,
};
writeFileSync(resolve(here, 'attestation.json'), JSON.stringify(report, null, 2));
console.log(`Attested ${sources.size} embedded Bloom sources and exact APK bundle`);
