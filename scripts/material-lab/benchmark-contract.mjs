import assert from 'node:assert/strict';
/** Fixed-time optics artifacts cannot establish motion performance. */
export function requireMotionArtifact(build) {
  assert(build.fixedOpticsTime == null, 'Fixed optics time cannot be benchmarked as motion');
  assert(
    !/(?:^|-)fixed(?:-|$)/.test(build.variant || ''),
    'Legacy fixed-phase artifact cannot establish motion performance',
  );
}
