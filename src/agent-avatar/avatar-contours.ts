import type { AvatarConfig } from './model';
import { isPaperSymbol, paperSymbolPoint } from './fold-outlines';
export type ContourPoint = [number, number];
/** Geometric path tessellation only: no drawing state, renderer, paint or animation. */
class Contour {
  readonly points: ContourPoint[] = [];
  private current: ContourPoint = [0, 0];
  moveTo(x: number, y: number) {
    this.lineTo(x, y);
  }
  lineTo(x: number, y: number) {
    this.current = [x, y];
    this.points.push(this.current);
  }
  closePath() {}
  bezierCurveTo(ax: number, ay: number, bx: number, by: number, x: number, y: number) {
    const from = this.current;
    for (let step = 1; step <= 24; step++) {
      const t = step / 24,
        u = 1 - t;
      this.lineTo(
        u ** 3 * from[0] + 3 * u * u * t * ax + 3 * u * t * t * bx + t ** 3 * x,
        u ** 3 * from[1] + 3 * u * u * t * ay + 3 * u * t * t * by + t ** 3 * y,
      );
    }
  }
  quadraticCurveTo(ax: number, ay: number, x: number, y: number) {
    const from = this.current;
    for (let step = 1; step <= 24; step++) {
      const t = step / 24,
        u = 1 - t;
      this.lineTo(
        u * u * from[0] + 2 * u * t * ax + t * t * x,
        u * u * from[1] + 2 * u * t * ay + t * t * y,
      );
    }
  }
}
const TAU = Math.PI * 2;
function blobContour(c: AvatarConfig) {
  const path = new Contour();
  if (c.family === 'alien') {
    const sx = c.alienShape === 'round' ? 1.06 : c.alienShape === 'long' ? 0.86 : 1;
    const sy = c.alienShape === 'round' ? 0.92 : c.alienShape === 'long' ? 1.03 : 1;
    path.moveTo(0, -86 * sy);
    path.bezierCurveTo(49 * sx, -88 * sy, 87 * sx, -61 * sy, 82 * sx, -20 * sy);
    path.bezierCurveTo(80 * sx, 18 * sy, 47 * sx, 52 * sy, 17 * sx, 80 * sy);
    path.quadraticCurveTo(0, 96 * sy, -17 * sx, 80 * sy);
    path.bezierCurveTo(-47 * sx, 52 * sy, -80 * sx, 18 * sy, -82 * sx, -20 * sy);
    path.bezierCurveTo(-87 * sx, -61 * sy, -49 * sx, -88 * sy, 0, -86 * sy);
    path.closePath();
  } else if (c.shape === 'squircle') {
    path.moveTo(-50, -82);
    path.bezierCurveTo(-80, -82, -82, -65, -82, -40);
    path.lineTo(-82, 45);
    path.bezierCurveTo(-82, 76, -70, 82, -42, 82);
    path.lineTo(45, 82);
    path.bezierCurveTo(78, 82, 82, 67, 82, 40);
    path.lineTo(82, -43);
    path.bezierCurveTo(82, -75, 70, -82, 42, -82);
    path.closePath();
  } else if (c.shape === 'triangle') {
    path.moveTo(-15, -78);
    path.quadraticCurveTo(0, -103, 16, -77);
    path.lineTo(84, 52);
    path.quadraticCurveTo(100, 80, 67, 82);
    path.lineTo(-68, 82);
    path.quadraticCurveTo(-100, 80, -84, 53);
    path.closePath();
  } else {
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * TAU;
      let radius = 83;
      if (c.shape === 'pebble')
        radius += 7 * Math.sin(a * 3 + 0.7 + (0 * c.motion) / 350) + 4 * Math.cos(a * 2 - 1);
      if (c.shape === 'flower') radius += 10 * Math.cos(a * 5 + 0.5);
      if (c.shape === 'diamond')
        radius = 83 / (Math.abs(Math.cos(a)) ** 1.35 + Math.abs(Math.sin(a)) ** 1.35) ** (1 / 1.35);
      const x = Math.cos(a) * radius,
        y = Math.sin(a) * radius;
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    path.closePath();
  }
  return path;
}

/** Saved silhouettes are geometric inputs to the single 3D renderer. */
export function avatarContours(c: AvatarConfig): ContourPoint[][] {
  if (c.family !== 'fold') return [blobContour(c).points.map(([x, y]) => [x / 83, -y / 83])];
  const sx = c.foldShape === 'slender' ? 0.86 : 1;
  const depth = (c.foldDepth - 45) * 0.35;
  const curl = 0;
  const seamX = 49 - depth;
  const symbol = isPaperSymbol(c.foldShape) ? c.foldShape : null;
  const shaped = c.foldShape === 'star' || c.foldShape === 'flower' || symbol !== null;
  const paper = new Contour(),
    back = new Contour();
  if (shaped) {
    const petals = c.foldShape === 'flower' ? 6 : 5;
    const flower = c.foldShape === 'flower';
    const tuck = 8 + c.foldDepth * 0.16 - curl * 0.35;
    // Both paper layers follow the same rounded contour; only the near sheet
    // tucks inward along one edge, leaving room for the eyes.
    const point = (angle: number, front: boolean): [number, number] => {
      const wave = Math.cos(petals * (angle + Math.PI / 2));
      const r = flower ? 58 + 28 * Math.sqrt(0.08 + (0.92 * (wave + 1)) / 2) : 73 + 17 * wave;
      const [x, y] = symbol
        ? paperSymbolPoint(symbol, angle)
        : [r * Math.cos(angle), r * Math.sin(angle)];
      const bearing = symbol ? Math.atan2(y, x) : angle;
      const edge = Math.max(0, Math.cos(bearing - 0.3));
      const fold = front ? tuck * edge * edge : 0;
      return [x - fold * Math.cos(bearing), y - fold * 0.45 * Math.sin(bearing)];
    };
    // Cubic interpolation keeps the tips and valleys soft, including at 24px.
    const trace = (path: Contour, front: boolean, start: number, end: number, closed: boolean) => {
      const steps = Math.ceil((end - start) * 12);
      const step = (end - start) / steps;
      const derivative = (angle: number): [number, number] => {
        const a = point(angle - 0.001, front),
          b = point(angle + 0.001, front);
        return [(b[0] - a[0]) / 0.002, (b[1] - a[1]) / 0.002];
      };
      path.moveTo(...point(start, front));
      for (let i = 0; i < steps; i++) {
        const angle = start + i * step;
        const a = point(angle, front),
          b = point(angle + step, front);
        const da = derivative(angle),
          db = derivative(angle + step);
        path.bezierCurveTo(
          a[0] + (da[0] * step) / 3,
          a[1] + (da[1] * step) / 3,
          b[0] - (db[0] * step) / 3,
          b[1] - (db[1] * step) / 3,
          b[0],
          b[1],
        );
      }
      if (closed) path.closePath();
    };
    trace(paper, true, -Math.PI / 2, Math.PI * 1.5, true);
    trace(back, false, -Math.PI / 2, Math.PI * 1.5, true);
  } else if (c.foldShape === 'pocket') {
    // A broad, soft paper pocket. Its lower corner rolls inward as it turns.
    const tuck = 48 - depth * 0.6 + curl * 0.65;
    paper.moveTo(-56, -68);
    paper.bezierCurveTo(-12, -73, 38, -73, 61, -64);
    paper.bezierCurveTo(79, -57, 83, -31, 78, 0);
    paper.bezierCurveTo(75, 24, tuck - 2, 31, tuck, 48);
    paper.bezierCurveTo(tuck + 2, 64, 12, 70, -40, 68);
    paper.bezierCurveTo(-69, 67, -81, 53, -81, 25);
    paper.bezierCurveTo(-83, -3, -84, -39, -75, -56);
    paper.bezierCurveTo(-71, -64, -64, -67, -56, -68);
    paper.closePath();
    back.moveTo(-56, -68);
    back.bezierCurveTo(-12, -73, 38, -73, 61, -64);
    back.bezierCurveTo(84, -56, 87, -32, 86, 1);
    back.bezierCurveTo(85, 36, 84 + curl * 0.3, 61, 63, 73);
    back.bezierCurveTo(41, 85, -12, 80, -43, 76);
    back.bezierCurveTo(-75, 72, -83, 52, -83, 23);
    back.bezierCurveTo(-85, -7, -84, -42, -75, -56);
    back.bezierCurveTo(-71, -64, -64, -67, -56, -68);
    back.closePath();
  } else if (c.foldShape === 'petal') {
    // A rounded, leaning tip opens into a fuller base; the fold follows its edge.
    const tuck = 45 - depth * 0.65 + curl * 0.7;
    paper.moveTo(10, -86);
    paper.bezierCurveTo(33, -91, 68, -51, 73, -20);
    paper.bezierCurveTo(80, 11, tuck - 5, 27, tuck, 47);
    paper.bezierCurveTo(tuck + 3, 66, 18, 78, -15, 78);
    paper.bezierCurveTo(-54, 78, -78, 52, -77, 17);
    paper.bezierCurveTo(-76, -19, -38, -74, 10, -86);
    paper.closePath();
    back.moveTo(10, -86);
    back.bezierCurveTo(35, -92, 71, -55, 82, -19);
    back.bezierCurveTo(94, 18, 81 + curl * 0.3, 61, 51, 79);
    back.bezierCurveTo(25, 95, -15, 90, -42, 72);
    back.bezierCurveTo(-69, 54, -81, 28, -77, 6);
    back.bezierCurveTo(-74, -27, -36, -75, 10, -86);
    back.closePath();
  } else {
    paper.moveTo(-65, -61);
    paper.bezierCurveTo(-43, -84, 16, -85, 55, -73);
    paper.bezierCurveTo(80, -65, 86, -41, 77, -13);
    paper.bezierCurveTo(69, 12, seamX - 6, 18, seamX + 1, 43);
    paper.bezierCurveTo(seamX + 7, 66, 27, 79, -9, 77);
    paper.bezierCurveTo(-56, 76, -79, 53, -83, 15);
    paper.bezierCurveTo(-87, -19, -83, -42, -65, -61);
    paper.closePath();
    back.moveTo(-65, -61);
    back.bezierCurveTo(-43, -84, 16, -85, 55, -73);
    back.bezierCurveTo(89, -62, 96, -29, 80, 8);
    back.bezierCurveTo(67, 39, 98 + curl, 49, 73, 72);
    back.bezierCurveTo(48, 94, -11, 88, -43, 68);
    back.bezierCurveTo(-78, 51, -86, 12, -83, -15);
    back.bezierCurveTo(-85, -37, -77, -51, -65, -61);
    back.closePath();
  }

  const direction = c.foldDirection === 'left' ? -1 : 1;
  return [paper, back].map((path) =>
    path.points.map(([x, y]) => [(x * sx * direction) / 83, -y / 83]),
  );
}
