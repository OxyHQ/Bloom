import { describe, it, expect } from 'bun:test';
import { androidRoundedRectOrigin, roundedPerimeterPath } from './rounded-perimeter';

function startPoint(path: string) {
  return path
    .match(/^M([^ ]+) ([^ALZ]+)/)!
    .slice(1)
    .map(Number);
}

describe('Android rounded path origin', () => {
  // Recorded with Path.addRoundRect(CW) + PathMeasure.getPosTan(0) on API36.
  it.each([
    [379, 52, 26, 0, 26],
    [100, 80, 10, 0, 70],
    [100, 80, 0, 0, 80],
  ])('retains the measured native anchor for %s×%s r%s', (w, h, r, x, y) => {
    const point = startPoint(roundedPerimeterPath(w, h, r, androidRoundedRectOrigin(w, h, r)));
    expect(point[0]).toBeCloseTo(x, 8);
    expect(point[1]).toBeCloseTo(y, 8);
  });

  it('keeps cyclic offsets finite and on the same outline, including collapsed straight segments', () => {
    for (const [w, h, r] of [
      [52, 52, 26],
      [24, 80, 50],
      [379, 52, 26],
      [100, 80, 0],
    ]) {
      const radius = Math.min(r!, w! / 2, h! / 2);
      const perimeter = 2 * (w! + h!) - 8 * radius + 2 * Math.PI * radius;
      for (const start of [
        -2 * perimeter,
        -1,
        0,
        0.1,
        perimeter / 2,
        perimeter - 0.1,
        2 * perimeter + 1,
      ]) {
        const path = roundedPerimeterPath(w!, h!, r!, start);
        expect(path).not.toMatch(/NaN|Infinity/);
        expect(path.endsWith('Z')).toBe(true);
        const point = startPoint(path);
        expect(point[0]).toBeGreaterThanOrEqual(-1e-8);
        expect(point[1]).toBeGreaterThanOrEqual(-1e-8);
        expect(point[0]).toBeLessThanOrEqual(w! + 1e-8);
        expect(point[1]).toBeLessThanOrEqual(h! + 1e-8);
        const cycled = startPoint(roundedPerimeterPath(w!, h!, r!, start + perimeter));
        expect(cycled[0]).toBeCloseTo(point[0]!, 7);
        expect(cycled[1]).toBeCloseTo(point[1]!, 7);
      }
    }
  });
});
