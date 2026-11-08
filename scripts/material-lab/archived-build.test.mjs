import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { requireArchivedBuild } from './archived-build.mjs';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const apk = Buffer.from('original immutable archive');
const bundle = Buffer.from('commit-a fixture-b source-c lock-d');
const record = {
  apkSha256: hash(apk),
  embeddedBundleSha256: hash(bundle),
  embeddedBloomFiles: 841,
  embeddedBloomSourceSha256: 'a'.repeat(64),
  commit: 'commit-a',
  fixtureSha256: 'fixture-b',
  sourceSha256: 'source-c',
  lockSha256: 'lock-d',
};
test('archive replay rejects swapped APK, bundle, or source attestation', () => {
  assert.equal(requireArchivedBuild(apk, bundle, record), record);
  assert.throws(
    () => requireArchivedBuild(Buffer.from('different APK'), bundle, record),
    /APK hash/,
  );
  assert.throws(
    () => requireArchivedBuild(apk, Buffer.from('different bundle'), record),
    /bundle hash/,
  );
  assert.throws(
    () => requireArchivedBuild(apk, bundle, { ...record, embeddedBloomFiles: 0 }),
    /source attestation/,
  );
  assert.throws(
    () => requireArchivedBuild(apk, bundle, { ...record, commit: 'other revision' }),
    /lacks commit/,
  );
});
