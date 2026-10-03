import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clippoPath,
  tubeMesh,
  composeClippoAssembly,
  clippoFaceEyeFit,
} from '../assets/character-runtime/clippo-geometry.mjs';
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const sub = (a, b) => a.map((v, k) => v - b[k]);
function covers(mesh, x, y) {
  const v = (i) => Array.from(mesh.vertices.subarray(i * 24, i * 24 + 3));
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c] = Array.from(mesh.indices.subarray(i, i + 3), v);
    const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (Math.abs(d) < 1e-10) continue;
    const u = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / d,
      w = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / d;
    if (u >= 0 && w >= 0 && u + w <= 1) return true;
  }
  return false;
}
test('Clippo is a finite outward rounded tube at both native quality levels', () => {
  for (const [steps, sides] of [
    [8, 10],
    [14, 16],
  ]) {
    const mesh = tubeMesh(clippoPath(steps), 0.063, sides),
      count = mesh.vertices.length / 24;
    assert.ok(count < 65536);
    assert.ok(mesh.indices.every((i) => i < count));
    assert.ok(mesh.vertices.every(Number.isFinite));
    for (let i = 0; i < mesh.vertices.length; i += 24) {
      assert.ok(
        Math.abs(Math.hypot(...mesh.vertices.subarray(i + 3, i + 6)) - 1) <
          1e-6,
      );
      for (const delta of [6, 12])
        assert.deepEqual(
          Array.from(mesh.vertices.subarray(i + delta, i + delta + 3)),
          [0, 0, 0],
        );
    }
    let faces = 0;
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const ids = Array.from(mesh.indices.subarray(i, i + 3)),
        p = ids.map((n) =>
          Array.from(mesh.vertices.subarray(n * 24, n * 24 + 3)),
        );
      const n = cross(sub(p[1], p[0]), sub(p[2], p[0]));
      if (Math.hypot(...n) < 1e-10) continue;
      const smooth = [0, 1, 2].map((k) =>
        ids.reduce((s, id) => s + mesh.vertices[id * 24 + 3 + k], 0),
      );
      assert.ok(
        n.reduce((s, v, k) => s + v * smooth[k], 0) > 0,
        'outward winding',
      );
      faces++;
    }
    assert.ok(faces > 1000);
  }
});
test('both paperclip openings are actual empty projected geometry', () => {
  const mesh = tubeMesh(clippoPath(14), 0.063, 16),
    sample = (x, y) => covers(mesh, (x - 650) / 240, (400 - y) / 240);
  assert.equal(sample(641, 434), false, 'inner opening');
  assert.equal(sample(691, 585), false, 'outer opening');
  assert.equal(sample(536, 482), true, 'left wire');
  assert.equal(sample(663, 657), true, 'bottom wire');
  assert.equal(sample(604, 383), true, 'rounded inner endpoint');
  assert.equal(sample(778, 360), true, 'rounded outer endpoint');
  assert.equal(sample(790, 300), false, 'outer end stays open');
  const path = clippoPath();
  assert.deepEqual(path[0], [(604 - 650) / 240, (400 - 383) / 240, 0]);
  assert.deepEqual(path.at(-1), [(778 - 650) / 240, (400 - 360) / 240, 0]);
});
test('invalid geometry is rejected before native allocation', () => {
  for (const n of [0, 3, 65, NaN, 4.5]) assert.throws(() => clippoPath(n));
  for (const args of [
    [[], 0.1, 12],
    [
      [
        [0, 0, 0],
        [NaN, 1, 0],
      ],
      0.1,
      12,
    ],
    [
      [
        [0, 0, 0],
        [0, 0, 0],
      ],
      0.1,
      12,
    ],
    [clippoPath(), 0, 12],
    [clippoPath(), 0.1, 3],
  ])
    assert.throws(() => tubeMesh(...args));
});
test('unselected native assemblies pass through untouched without source preparation', async () => {
  const bytes = new Uint8Array([1, 2, 3]);
  assert.equal(await composeClippoAssembly(null, bytes, {}), bytes);
  assert.equal(
    await composeClippoAssembly(null, bytes, {
      authoredParts: { eyes: 'todd' },
    }),
    bytes,
  );
});

test('Clippo white eye size and depth do not collapse with narrow native eye spacing', () => {
  const body = { min: [-1, -1, -0.88], max: [1, 1, 0.88] };
  for (const center of [-0.1, -0.2, -0.46, 0.1, 0.2, 0.46]) {
    const anchor = {
      min: [center - 0.1, 0.05, 0.783],
      max: [center + 0.1, 0.35, 0.905],
    };
    const fit = clippoFaceEyeFit(body, anchor);
    assert.deepEqual(fit.radius, [0.2, 0.21, 0.14]);
    assert.ok(Math.abs(fit.center[0] - center) < 1e-12);
    assert.ok(
      fit.center[2] + fit.radius[2] > 1.05,
      'white-eye front remains beyond backing face',
    );
    assert.ok(
      Math.abs(fit.center[2] - fit.radius[2] - anchor.min[2]) < 1e-12,
      'eye remains attached at original back surface',
    );
  }
  assert.throws(
    () => clippoFaceEyeFit(body, { min: [NaN, 0, 0], max: [1, 1, 1] }),
    /fitting bounds/,
  );
});
