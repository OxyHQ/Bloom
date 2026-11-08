/** Run with Bun. Original donor contour preservation through the actual compositor. */
import assert from 'node:assert/strict';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { composeVectorCharacter, paintVectorCharacter } from '../src/agent-avatar/vector-compose';
import { resolveAvatarCharacter } from '../src/agent-avatar/character';
import { vectorAssetLoader } from '../src/agent-avatar/vector-assets';
import { AVATAR_EYEWEAR, AVATAR_SHAPES } from '../src/agent-avatar/catalog-ids';
import { sampleVectorPose } from '../src/agent-avatar/vector-pose';
import type { VectorData } from '../src/agent-avatar/vector-types';
const opaque = new Set(['classic_sunglasses', 'round_sunglasses', 'separate_trapezoid_lenses']);
function vertices(data: VectorData, index: number) {
  const t = sampleVectorPose(data, 'idle', 0)[index]!;
  const m = t.matrix?.value
    ? new Matrix4().fromArray(t.matrix.value)
    : new Matrix4().compose(
        new Vector3(...t.translation.value!),
        new Quaternion(...t.rotation.value!),
        new Vector3(...t.scale.value!),
      );
  return data.parts[index]!.points.map((p) => new Vector3(...p).applyMatrix4(m).toArray());
}
let cases = 0,
  points = 0,
  maxError = 0;
for (const eyewear of AVATAR_EYEWEAR.filter((id) => id !== 'none')) {
  const donor = await vectorAssetLoader.eyewear(eyewear);
  const original = JSON.stringify(donor);
  for (const shape of AVATAR_SHAPES) {
    const character = resolveAvatarCharacter({
      shape,
      eyes: shape.startsWith('bot_') ? 'bot' : 'oval',
      eyewear,
      accessory: 'none',
      color: 'blue',
    });
    const result = await composeVectorCharacter(character, vectorAssetLoader);
    const pairs: number[][] = [];
    donor.parts.forEach((part, index) => {
      if (part.role !== 'eyewear') return;
      const target = result.parts.findIndex((p) => p.id === `eyewear:${eyewear}:${part.id}`);
      assert.ok(target >= 0);
      assert.deepEqual(result.parts[target]!.faces, part.faces);
      const source = vertices(donor, index),
        fitted = vertices(result, target);
      assert.equal(source.length, fitted.length);
      source.forEach((p, i) => pairs.push([p[0]!, p[1]!, fitted[i]![0]!, fitted[i]![1]!]));
    });
    const center = [0, 1, 2, 3].map((k) => pairs.reduce((sum, p) => sum + p[k]!, 0) / pairs.length);
    let denominator = 0,
      a = 0,
      b = 0;
    for (const p of pairs) {
      const x = p[0]! - center[0]!,
        y = p[1]! - center[1]!,
        u = p[2]! - center[2]!,
        v = p[3]! - center[3]!;
      denominator += x * x + y * y;
      a += x * u + y * v;
      b += x * v - y * u;
    }
    a /= denominator;
    b /= denominator;
    for (const p of pairs) {
      const x = p[0]! - center[0]!,
        y = p[1]! - center[1]!;
      const error = Math.hypot(
        a * x - b * y + center[2]! - p[2]!,
        b * x + a * y + center[3]! - p[3]!,
      );
      maxError = Math.max(maxError, error);
      assert.ok(error < 1e-6, `${shape}/${eyewear} distorted contour: ${error}`);
    }
    const eyes = result.parts.filter((p) => p.role === 'eye');
    assert.ok(eyes.length);
    if (opaque.has(eyewear))
      for (const p of eyes) {
        assert.equal(p.opacity, 0);
        assert.equal(p.stroke, undefined);
        assert.equal(p.strokeWidth, undefined);
      }
    else assert.ok(eyes.some((p) => (p.opacity ?? 1) > 0));
    assert.equal(JSON.stringify(donor), original);
    cases++;
    points += pairs.length;
  }
}
const visible = await composeVectorCharacter(
  resolveAvatarCharacter({
    shape: 'bot_blob',
    eyes: 'bot',
    eyewear: 'none',
    accessory: 'none',
    color: 'blue',
  }),
  vectorAssetLoader,
);
assert.ok(visible.parts.filter((p) => p.role === 'eye').every((p) => (p.opacity ?? 1) > 0));
const outlined = {
  ...visible,
  parts: visible.parts.map((p) =>
    p.role === 'eye' ? { ...p, stroke: '#fff', strokeWidth: 2 } : p,
  ),
};
const hidden = paintVectorCharacter(
  outlined,
  resolveAvatarCharacter({
    shape: 'bot_blob',
    eyes: 'bot',
    eyewear: 'classic_sunglasses',
    accessory: 'none',
    color: 'blue',
  }),
);
assert.ok(
  hidden.parts
    .filter((p) => p.role === 'eye')
    .every((p) => p.opacity === 0 && p.stroke === undefined),
);
console.log(
  JSON.stringify({
    cases,
    points,
    maxError,
    opaquePaintSuppression: true,
    sourceImmutable: true,
    eyesRestore: true,
  }),
);
