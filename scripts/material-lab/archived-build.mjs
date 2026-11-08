import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
/** Verify an immutable APK against a previously recorded successful source
 * attestation. This does not claim it matches the current checkout. */
export function requireArchivedBuild(apk, bundle, record) {
  const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha(apk), record.apkSha256, 'Archived APK hash differs from its attestation');
  assert.equal(
    sha(bundle),
    record.embeddedBundleSha256,
    'Archived bundle hash differs from its attestation',
  );
  assert(
    record.embeddedBloomFiles > 0 && /^[a-f0-9]{64}$/.test(record.embeddedBloomSourceSha256),
    'Missing original embedded-source attestation',
  );
  for (const key of ['commit', 'fixtureSha256', 'sourceSha256', 'lockSha256']) {
    assert(
      typeof record[key] === 'string' &&
        record[key].length > 0 &&
        bundle.includes(Buffer.from(record[key])),
      `Archived bundle lacks ${key}`,
    );
  }
  return record;
}
