import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { roundedPerimeterPath } from './material-lab/experiments/rounded-perimeter.ts';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_PATH || 'puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  const cases = [];
  for (const [width, height, radius] of [
    [379, 52, 26],
    [100, 80, 10],
    [100, 80, 0],
    [52, 52, 26],
    [24, 80, 50],
    [320, 160, 24],
  ]) {
    const r = Math.min(radius, width / 2, height / 2);
    const perimeter = 2 * (width + height) - 8 * r + 2 * Math.PI * r;
    for (const start of [
      -perimeter,
      -1,
      0,
      0.1,
      1,
      perimeter / 4,
      perimeter / 2,
      perimeter - 0.1,
      perimeter * 2 + 16,
    ])
      cases.push({
        width,
        height,
        radius: r,
        perimeter,
        start,
        d: roundedPerimeterPath(width, height, r, start),
      });
  }
  const results = await page.evaluate(
    (cases) =>
      cases.map((item) => {
        const ns = 'http://www.w3.org/2000/svg';
        const rect = document.createElementNS(ns, 'rect');
        for (const [key, value] of Object.entries({
          width: item.width,
          height: item.height,
          rx: item.radius,
          ry: item.radius,
        }))
          rect.setAttribute(key, String(value));
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', item.d);
        const reference = document.createElementNS(ns, 'path');
        const { width: w, height: h, radius: r } = item;
        reference.setAttribute(
          'd',
          `M${r} 0 L${w - r} 0 A${r} ${r} 0 0 1 ${w} ${r} L${w} ${h - r} A${r} ${r} 0 0 1 ${w - r} ${h} L${r} ${h} A${r} ${r} 0 0 1 0 ${h - r} L0 ${r} A${r} ${r} 0 0 1 ${r} 0 Z`,
        );
        const svg = document.createElementNS(ns, 'svg');
        svg.append(rect, path, reference);
        document.body.append(svg);
        const rectLength = reference.getTotalLength(),
          pathLength = path.getTotalLength();
        let maxDistance = 0;
        // A degenerate radius starts at x=0; otherwise the SVG rect starts at rx,0.
        const start = ((item.start % item.perimeter) + item.perimeter) % item.perimeter;
        for (let i = 0; i < 80; i++) {
          const progress = i / 80;
          const a = path.getPointAtLength(pathLength * progress);
          const b = reference.getPointAtLength((start + rectLength * progress) % rectLength);
          maxDistance = Math.max(maxDistance, Math.hypot(a.x - b.x, a.y - b.y));
        }
        return {
          width: item.width,
          height: item.height,
          radius: item.radius,
          start: item.start,
          maxDistance,
          lengthDelta: Math.abs(rectLength - pathLength),
          rectApiLengthDelta: Math.abs(rect.getTotalLength() - rectLength),
        };
      }),
    cases,
  );
  const worst = results.reduce((a, b) => (a.maxDistance > b.maxDistance ? a : b));
  assert(
    worst.maxDistance < 0.5,
    `Rounded path diverged from independently authored reference: ${JSON.stringify(worst)}`,
  );
  console.log(
    JSON.stringify({
      cases: results.length,
      sampledPoints: results.length * 80,
      worst,
      note: 'Browser geometry check only; native Skia origin is probed separately.',
    }),
  );
} finally {
  await browser.close();
}
