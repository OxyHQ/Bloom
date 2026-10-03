import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cyclopsPlacement,
  composeCyclopsAssembly,
} from '../assets/character-runtime/cyclops-geometry.mjs';

const body = { min: [-1, -1, -0.4], max: [1, 1, 0.4] };
const eyes = [-1, 1].map((side) => ({
  bounds: {
    min: [side * 0.4 - 0.1, 0.5, 0.3],
    max: [side * 0.4 + 0.1, 0.7, 0.5],
  },
}));

test('a single eye sits on the upper body instead of between raised eye stalks', () => {
  const placement = cyclopsPlacement(body, eyes);
  assert.equal(placement.center[0], 0);
  assert.ok(placement.center[1] > 0.1 && placement.center[1] < 0.5);
  assert.ok(placement.radius > 0.4 && placement.radius < 0.6);
  assert.ok(placement.center[0] - placement.radius > body.min[0]);
  assert.ok(placement.center[0] + placement.radius < body.max[0]);
});
test('narrow wire faces use their face height and a smaller single eyeball', () => {
  const narrow = { min: [-0.4, -1, -0.07], max: [0.4, 1, 0.07] };
  const placement = cyclopsPlacement(narrow, eyes, true);
  assert.equal(placement.center[1], 0.6);
  assert.ok(placement.radius < 0.3);
  assert.ok(placement.center.every(Number.isFinite));
});
test('occluded original eyes can use body bounds without inventing paired eye anchors', () => {
  assert.deepEqual(cyclopsPlacement(body, []), cyclopsPlacement(body, eyes));
});
test('missing wire anchors or non-finite face geometry is rejected', () => {
  assert.throws(() => cyclopsPlacement(body, [], true), /face bounds/);
  assert.throws(
    () => cyclopsPlacement({ ...body, max: [Infinity, 1, 1] }, eyes),
    /face bounds/,
  );
});
test('unselected recipes retain exact original assembly bytes without preparing a donor', async () => {
  const bytes = Uint8Array.from([1, 2, 3]);
  const module = {
    orbitPrepareAssembly() {
      throw new Error('unused donor');
    },
  };
  assert.equal(
    await composeCyclopsAssembly(module, bytes, {
      authoredParts: { eyes: 'todd' },
    }),
    bytes,
  );
});
