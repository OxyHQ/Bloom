import { Matrix4, Quaternion, Vector3 } from 'three';
import { sampleVectorPose } from '../vector-pose';
import { resolveAvatarCharacter } from '../character';
import { vectorAssetLoader } from '../vector-assets';
import { composeVectorCharacter } from '../vector-compose';
import { projectReferenceFacePoint } from '../vector-face';
import type { VectorPart } from '../vector-types';

function insideBody(body: VectorPart, x: number, y: number): boolean {
  return body.faces.some(([ia, ib, ic]) => {
    const a = body.points[ia!]!,
      b = body.points[ib!]!,
      c = body.points[ic!]!;
    const d = (b[1]! - c[1]!) * (a[0]! - c[0]!) + (c[0]! - b[0]!) * (a[1]! - c[1]!);
    if (Math.abs(d) < 1e-9) return false;
    const u = ((b[1]! - c[1]!) * (x - c[0]!) + (c[0]! - b[0]!) * (y - c[1]!)) / d;
    const v = ((c[1]! - a[1]!) * (x - c[0]!) + (a[0]! - c[0]!) * (y - c[1]!)) / d;
    return Math.min(u, v, 1 - u - v) >= -1e-5;
  });
}
const examples = [
  ['bot_blob', 'sleepy_lids'],
  ['bot_wedge', 'sleepy_lids'],
  ['bot_blob', 'dots'],
  ['bot_wedge', 'dots'],
  ['bot_blob', 'cyclops'],
  ['bot_wedge', 'cyclops'],
  ['bot_sparkle', 'clippo'],
  ['bot_sparkle', 'round_inset'],
  ['bot_sparkle', 'cyclops'],
  ['bot_star', 'cyclops'],
  ['bot_cloud', 'cyclops'],
] as const;
it.each(examples)(
  '%s with %s keeps the complete custom face inside its outline throughout pointer gaze',
  async (shape, eyes) => {
    const data = await composeVectorCharacter(
      resolveAvatarCharacter({ shape, eyes, eyewear: 'none', accessory: 'none', color: 'blue' }),
      vectorAssetLoader,
    );
    const body = data.parts.find((p) => p.role === 'body')!;
    for (const yaw of [-0.6, 0, 0.6])
      for (const pitch of [-0.45, 0, 0.45]) {
        const outside = data.parts
          .filter((p) => p.role === 'eye')
          .flatMap((part) => part.points)
          .filter((p) => {
            const q = projectReferenceFacePoint(data.referenceFace!, p, { yaw, pitch, mix: 1 });
            return !insideBody(body, q[0]!, q[1]!);
          });
        expect({ yaw, pitch, outside: outside.length }).toEqual({ yaw, pitch, outside: 0 });
      }
  },
);

it('scales a fitted expression and its blink vectors uniformly without mutating the donor', async () => {
  const donor = await vectorAssetLoader.eyes('clippo');
  const snapshot = JSON.stringify(donor);
  const data = await composeVectorCharacter(
    resolveAvatarCharacter({
      shape: 'bot_sparkle',
      eyes: 'clippo',
      eyewear: 'none',
      accessory: 'none',
      color: 'blue',
    }),
    vectorAssetLoader,
  );
  let checked = 0,
    maximumError = 0;
  const pose = sampleVectorPose(donor, 'idle', 0);
  for (const target of data.parts.filter((part) => part.role === 'eye' && part.delta0)) {
    const index = donor.parts.findIndex((part) => target.id === `eye:clippo:${part.id}`);
    const original = donor.parts[index]!;
    const track = pose[index]!;
    const matrix = track.matrix?.value
      ? new Matrix4().fromArray(track.matrix.value)
      : new Matrix4().compose(
          new Vector3().fromArray(track.translation.value!),
          new Quaternion().fromArray(track.rotation.value!),
          new Vector3().fromArray(track.scale.value!),
        );
    const sourceY = original.points.map(
      (point) => new Vector3().fromArray(point).applyMatrix4(matrix).y,
    );
    const targetY = target.points.map((point) => point[1]!);
    const scale =
      (Math.max(...targetY) - Math.min(...targetY)) / (Math.max(...sourceY) - Math.min(...sourceY));
    expect(scale).toBeGreaterThan(0);
    for (let i = 0; i < original.delta0!.length; i++) {
      const delta = original.delta0![i]!;
      const sourceDeltaY =
        matrix.elements[1]! * delta[0]! +
        matrix.elements[5]! * delta[1]! +
        matrix.elements[9]! * delta[2]!;
      maximumError = Math.max(
        maximumError,
        Math.abs(target.delta0![i]![1]! - sourceDeltaY * scale),
      );
      checked++;
    }
  }
  expect(checked).toBeGreaterThan(100);
  expect(maximumError).toBeLessThan(1e-8);
  expect(JSON.stringify(donor)).toBe(snapshot);
});
