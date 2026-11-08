import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requireMotionArtifact } from './benchmark-contract.mjs';
test('rejects fixed clocks even when the visible speed control still says4.5', () => {
  assert.throws(
    () => requireMotionArtifact({ fixedOpticsTime: 1, variant: 'hardware-probe' }),
    /Fixed optics time/,
  );
  assert.throws(
    () => requireMotionArtifact({ fixedOpticsTime: 0, variant: 'hardware-probe' }),
    /Fixed optics time/,
  );
  assert.throws(() => requireMotionArtifact({ variant: 'hardware-fixed' }), /Legacy fixed-phase/);
  requireMotionArtifact({ fixedOpticsTime: null, variant: 'hardware-probe' });
  requireMotionArtifact({ variant: 'production-svg' });
});
