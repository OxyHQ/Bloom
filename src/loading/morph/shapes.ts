import { FLOAT_PI } from './const';
import {
  cornerRounding,
  createCircle,
  createPolygonFromVertices,
  createRectangle,
  createStar,
  unrounded,
} from './polygon';
import type { RoundedPolygon } from './polygon';
import type { CornerRounding, PointNRound } from './types';

function pnr(x: number, y: number, r: CornerRounding = unrounded): PointNRound {
  return { x, y, r };
}

function angleDegrees(x: number, y: number): number {
  return (Math.atan2(y, x) * 180) / FLOAT_PI;
}

function toRadians(degrees: number): number {
  return (degrees / 360) * 2 * FLOAT_PI;
}

function distancePt(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

function rotateDegrees(px: number, py: number, angle: number, cx = 0, cy = 0): [number, number] {
  const a = toRadians(angle);
  const ox = px - cx;
  const oy = py - cy;
  return [ox * Math.cos(a) - oy * Math.sin(a) + cx, ox * Math.sin(a) + oy * Math.cos(a) + cy];
}

function doRepeatMirrored(
  points: PointNRound[],
  reps: number,
  centerX: number,
  centerY: number,
): PointNRound[] {
  const angles = points.map((p) => angleDegrees(p.x - centerX, p.y - centerY));
  const distances = points.map((p) => distancePt(p.x - centerX, p.y - centerY));
  const actualReps = reps * 2;
  const sectionAngle = 360 / actualReps;
  const result: PointNRound[] = [];

  for (let it = 0; it < actualReps; it++) {
    const mirrored = it % 2 !== 0;
    for (let index = 0; index < points.length; index++) {
      const i = mirrored ? points.length - 1 - index : index;
      if (i > 0 || !mirrored) {
        const angleOffset = mirrored ? sectionAngle - angles[i]! + 2 * angles[0]! : angles[i];
        const a = toRadians(sectionAngle * it + angleOffset!);
        const finalX = Math.cos(a) * distances[i]! + centerX;
        const finalY = Math.sin(a) * distances[i]! + centerY;
        result.push(pnr(finalX, finalY, points[i]!.r!));
      }
    }
  }
  return result;
}

function doRepeatRotated(
  points: PointNRound[],
  reps: number,
  centerX: number,
  centerY: number,
): PointNRound[] {
  const np = points.length;
  const result: PointNRound[] = [];
  for (let it = 0; it < np * reps; it++) {
    const srcPoint = points[it % np];
    const [rx, ry] = rotateDegrees(
      srcPoint!.x,
      srcPoint!.y,
      Math.floor(it / np) * (360 / reps),
      centerX,
      centerY,
    );
    result.push(pnr(rx, ry, srcPoint!.r));
  }
  return result;
}

function doRepeat(
  points: PointNRound[],
  reps: number,
  centerX: number,
  centerY: number,
  mirroring: boolean,
): PointNRound[] {
  if (mirroring) {
    return doRepeatMirrored(points, reps, centerX, centerY);
  }
  return doRepeatRotated(points, reps, centerX, centerY);
}

function customPolygon(
  points: PointNRound[],
  reps: number,
  centerX = 0.5,
  centerY = 0.5,
  mirroring = false,
): RoundedPolygon {
  const actualPoints = doRepeat(points, reps, centerX, centerY, mirroring);
  const vertices: number[] = [];
  const pvRounding: CornerRounding[] = [];
  for (const p of actualPoints) {
    vertices.push(p.x, p.y);
    pvRounding.push(p.r);
  }
  return createPolygonFromVertices(vertices, unrounded, pvRounding, centerX, centerY);
}

function rotatePolygon(polygon: RoundedPolygon, degrees: number): RoundedPolygon {
  const rad = toRadians(degrees);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return polygon.transformed((x, y) => ({
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  }));
}

const r15 = cornerRounding(0.15);
const r20 = cornerRounding(0.2);
const r30 = cornerRounding(0.3);
const r50 = cornerRounding(0.5);
const r100 = cornerRounding(1);

function oval(): RoundedPolygon {
  const scaled = createCircle().transformed((x, y) => ({ x, y: y * 0.64 }));
  return rotatePolygon(scaled, -45);
}

function pill(): RoundedPolygon {
  return customPolygon(
    [
      pnr(0.961, 0.039, cornerRounding(0.426)),
      pnr(1.001, 0.428),
      pnr(1.0, 0.609, cornerRounding(1.0)),
    ],
    2,
    0.5,
    0.5,
    true,
  );
}

function pentagon(): RoundedPolygon {
  return customPolygon(
    [
      pnr(0.5, -0.009, cornerRounding(0.172)),
      pnr(1.03, 0.365, cornerRounding(0.164)),
      pnr(0.828, 0.97, cornerRounding(0.169)),
    ],
    1,
    0.5,
    0.5,
    true,
  );
}

function sunny(): RoundedPolygon {
  return createStar(8, 1, 0.8, r15);
}

function cookie4(): RoundedPolygon {
  return customPolygon(
    [pnr(1.237, 1.236, cornerRounding(0.258)), pnr(0.5, 0.918, cornerRounding(0.233))],
    4,
  );
}

function cookie9(): RoundedPolygon {
  return rotatePolygon(createStar(9, 1, 0.8, r50), -90);
}

function softBurst(): RoundedPolygon {
  return customPolygon(
    [pnr(0.193, 0.277, cornerRounding(0.053)), pnr(0.176, 0.055, cornerRounding(0.053))],
    10,
  );
}

export { cookie4, cookie9, oval, pentagon, pill, softBurst, sunny };
