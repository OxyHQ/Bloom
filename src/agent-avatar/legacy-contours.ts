import { avatarSilhouette } from './artwork';
import { DrawingContext, type DrawingPath, type Point } from './drawing';
import { expressionRig } from './face';
import { drawFold } from './fold';
import type { AvatarConfig } from './model';
import type { ShapeMorph } from './shape-morph';

/** Sample the existing artwork, so a migrated silhouette has one source of truth. */
function samplePath(path: DrawingPath): Point[] {
  const points: Point[] = [];
  let current: Point = [0, 0];
  for (const { kind, values: v } of path.commands) {
    if (kind === 'M' || kind === 'L') {
      current = [v[0]!, v[1]!];
      points.push(current);
    } else if (kind === 'C' || kind === 'Q') {
      const from = current;
      for (let step = 1; step <= 24; step++) {
        const t = step / 24,
          u = 1 - t;
        current =
          kind === 'C'
            ? [
                u ** 3 * from[0] +
                  3 * u * u * t * v[0]! +
                  3 * u * t * t * v[2]! +
                  t ** 3 * v[4]!,
                u ** 3 * from[1] +
                  3 * u * u * t * v[1]! +
                  3 * u * t * t * v[3]! +
                  t ** 3 * v[5]!,
              ]
            : [
                u * u * from[0] + 2 * u * t * v[0]! + t * t * v[2]!,
                u * u * from[1] + 2 * u * t * v[1]! + t * t * v[3]!,
              ];
        points.push(current);
      }
    } else if (kind !== 'Z') {
      throw new Error('Unsupported legacy contour command');
    }
  }
  return points;
}

/** Engine coordinates: Y upwards, the existing circular body's radius is one. */
export function legacyContours(config: AvatarConfig): Point[][] {
  const rest = { ...config, motion: 0, idle: false, face: false };
  if (rest.family !== 'fold') {
    return [
      samplePath(avatarSilhouette(rest, 0)).map(([x, y]) => [x / 83, -y / 83]),
    ];
  }
  const morph: ShapeMorph = { started: 0, active: false };
  drawFold(
    new DrawingContext(),
    rest,
    0,
    expressionRig(rest),
    [0, 0],
    200,
    null,
    0,
    1,
    0,
    morph,
  );
  const geometry = morph.last!;
  const direction = rest.foldDirection === 'left' ? -1 : 1;
  return [geometry.paper, geometry.back].map((path) =>
    samplePath(path).map(([x, y]) => [
      (x * geometry.sx * direction) / 83,
      -y / 83,
    ]),
  );
}
