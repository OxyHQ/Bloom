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
