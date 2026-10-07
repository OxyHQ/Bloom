import assert from 'node:assert/strict';
import test from 'node:test';
import {
  shapeFaceLayout,
  fitCatalogPartRecords,
  fitAuthoredEyeSpacing,
} from '../assets/character-runtime/authored-parts.mjs';
import { MIGRATED_FACES } from '../assets/character-runtime/migrated-faces.mjs';
import { MIGRATED_CONTOURS } from '../assets/character-runtime/migrated-contours.mjs';
import { authoredPartsFor } from '../assets/character-runtime/character-recipe.mjs';
function face(gap = 0.4, radius = 0.15) {
  const bytes = new Uint8Array(256),
    body = { bounds: { min: [-1, -1, -0.5], max: [1, 1, 0.9] } };
  const records = [
    body,
    ...[-1, 1].map((sign, i) => {
      const start = i * 128,
        at = start + 24,
        label = new TextEncoder().encode('oval');
      new DataView(bytes.buffer).setUint32(at, label.length, true);
      bytes.set(label, at + 4);
      return {
        part: i + 1,
        start,
        nameOffset: start + 100,
        bounds: {
          min: [(sign * gap) / 2 - radius, 0.2 - radius, 0.8],
          max: [(sign * gap) / 2 + radius, 0.2 + radius, 0.9],
        },
      };
    }),
  ];
  return { bytes, body, records };
}
test('a native body face is captured before replacement styles and retains actual asymmetry', () => {
  const info = face(0.9, 0.2);
  info.records[2].bounds.min[1] += 0.05;
  info.records[2].bounds.max[1] += 0.05;
  const layout = shapeFaceLayout(info, {});
  assert.deepEqual(
    layout.centers.map((c) => c.slice(0, 2)),
    [
      [-0.45, 0.2],
      [0.45, 0.25],
    ],
  );
  assert.ok(Math.abs(layout.radius - 0.2) < 1e-10);
});
test('replacement styles use the same shape centers and diameter even when donor sizes/gaps differ', () => {
  const target = face(),
    layout = shapeFaceLayout(target, {});
  for (const donor of [face(0.2, 0.1), face(0.8, 0.3), face(1.1, 0.5)]) {
    const transforms = fitCatalogPartRecords(target, donor, 'eyes', 'oval', {
      faceLayout: layout,
    });
    for (const [i, t] of transforms.entries()) {
      assert.ok(
        Math.abs(
          (t.scale *
            (donor.records[i + 1].bounds.max[1] -
              donor.records[i + 1].bounds.min[1])) /
            2 -
            layout.radius,
        ) < 1e-10,
      );
      for (let k = 0; k < 2; k++)
        assert.ok(
          Math.abs(t.origin[k] + t.translate[k] - layout.centers[i][k]) < 1e-10,
        );
    }
  }
});
test('all eight migrated faces use source-defined positions and old matching contours resolve identically', () => {
  for (const id of Object.keys(MIGRATED_FACES)) {
    const explicit = shapeFaceLayout(face(), {
        authoredParts: { faceShape: id },
      }),
      saved = shapeFaceLayout(face(), { points: MIGRATED_CONTOURS[id] });
    assert.deepEqual(explicit, saved);
    assert.deepEqual(
      explicit.centers.map((c) => c.slice(0, 2)),
      MIGRATED_FACES[id].centers,
    );
    assert.equal(explicit.radius, MIGRATED_FACES[id].radius);
    const props = {
      config: {},
      legacy: {
        points: MIGRATED_CONTOURS[id],
        eyes: 'oval',
        patch: { bodyColor: '#123456' },
      },
    };
    const parts = authoredPartsFor(props);
    assert.equal(parts.faceShape, undefined);
    assert.deepEqual(
      shapeFaceLayout(face(), {
        points: props.legacy.points,
        authoredParts: parts,
      }),
      explicit,
    );
  }
});
test('historical eye distance never changes prepared geometry or demotes an untouched named preset', async () => {
  const bytes = new Uint8Array([1, 2, 3]);
  for (const eyeSpacing of [0.5, 1, 1.5, NaN]) {
    assert.equal(await fitAuthoredEyeSpacing(bytes, { eyeSpacing }), bytes);
    const props = {
      config: { character: { preset: 'lime_frog', eyeSpacing } },
    };
    assert.deepEqual(authoredPartsFor(props), {});
    assert.ok(Object.hasOwn(props.config.character, 'eyeSpacing'));
  }
});
test('a genuinely custom contour derives its face from its own geometry instead of a circle default', () => {
  const one = shapeFaceLayout(face(), {
    points: [
      [-0.8, -1],
      [0.8, -1],
      [0.8, 1],
      [-0.8, 1],
    ],
  });
  const two = shapeFaceLayout(face(), {
    points: [
      [-0.4, -1],
      [0.4, -1],
      [0.4, 1],
      [-0.4, 1],
    ],
  });
  assert.ok(two.radius < one.radius);
  assert.ok(
    two.centers[1][0] - two.centers[0][0] <
      one.centers[1][0] - one.centers[0][0],
  );
});
