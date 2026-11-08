/** Run with Bun: every semantic shape and eye style across the complete pointer grid. */
import assert from 'node:assert/strict';
import { SVG_SHAPES } from '../src/agent-avatar/svg-catalog';
import { AVATAR_EYES } from '../src/agent-avatar/catalog-ids';
import { resolveAvatarCharacter } from '../src/agent-avatar/character';
import { composeVectorCharacter } from '../src/agent-avatar/vector-compose';
import { vectorAssetLoader } from '../src/agent-avatar/vector-assets';
import { projectReferenceFacePoint } from '../src/agent-avatar/vector-face';
import type { VectorPart } from '../src/agent-avatar/vector-types';
function inside(body: VectorPart, x: number, y: number) {
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
let poses = 0,
  vertices = 0;
const failures = [];
for (const shape of SVG_SHAPES)
  for (const eyes of AVATAR_EYES) {
    const data = await composeVectorCharacter(
      resolveAvatarCharacter({ shape, eyes, eyewear: 'none', accessory: 'none', color: 'blue' }),
      vectorAssetLoader,
    );
    const body = data.parts.find((part) => part.role === 'body')!;
    for (const yaw of [-0.6, 0, 0.6])
      for (const pitch of [-0.45, 0, 0.45]) {
        let outside = 0;
        for (const part of data.parts.filter((part) => part.role === 'eye'))
          for (const point of part.points) {
            const q = projectReferenceFacePoint(data.referenceFace!, point, { yaw, pitch, mix: 1 });
            assert(q.every(Number.isFinite));
            vertices++;
            if (!inside(body, q[0]!, q[1]!)) outside++;
          }
        poses++;
        if (outside) failures.push({ shape, eyes, yaw, pitch, outside });
      }
  }
console.log(JSON.stringify({ poses, vertices, failures }, null, 2));
assert.equal(failures.length, 0, 'Every complete eye assembly must remain inside its silhouette');
