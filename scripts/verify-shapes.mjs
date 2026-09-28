/** Real renderer gate: run Storybook first, then node scripts/verify-shapes.mjs [url]. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
const require = createRequire(import.meta.url);
// Tooling stays outside the shipped dependency graph. CI may point at a shared install.
const puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer-core');
const executablePath =
  process.env.CHROME_PATH ??
  [
    '/opt/google/chrome/chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].find(existsSync);
if (!executablePath)
  throw new Error('Set CHROME_PATH to a Chrome or Chromium executable.');
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 1 });
const base = process.argv[2] ?? 'http://localhost:6018';
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
try {
  await page.goto(
    `${base}/iframe.html?id=base-shapes--geometry&viewMode=story`,
    { waitUntil: 'networkidle0' },
  );
  await page.waitForSelector('[data-testid="shape-border-probe"] svg', {
    timeout: 30000,
  });
  const probe = await page.$('[data-testid="shape-border-probe"]');
  const png = await probe.screenshot({ encoding: 'base64' });
  const thickness = await page.evaluate(async (encoded) => {
    const image = new Image();
    image.src = `data:image/png;base64,${encoded}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    const red = (x, y) => {
      const i = (y * image.width + x) * 4;
      return pixels[i] > 220 && pixels[i + 1] < 80 && pixels[i + 2] < 80;
    };
    let cardinal = 0,
      diagonal = 0;
    for (let i = 0; i < 128; i++) {
      if (red(i, 128)) cardinal++;
      if (red(i, i)) diagonal++;
    }
    return { cardinal, diagonal: diagonal * Math.SQRT2 };
  }, png);
  assert.equal(thickness.cardinal, 8);
  // One diagonal sample spans sqrt(2) pixels. This bound rejects the old ~16px band.
  assert.ok(
    Math.abs(thickness.diagonal - 8) <= Math.SQRT2,
    JSON.stringify(thickness),
  );
  await page.waitForSelector('[data-testid="shape-fixed-child"]', {
    timeout: 30000,
  });
  const geometry = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="shape-card"]');
    const clip = [...card.children].find(
      (node) => getComputedStyle(node).overflow === 'hidden',
    );
    const rtl = getComputedStyle(
      document.querySelector('[data-testid="shape-rtl"]'),
    );
    return {
      supported: CSS.supports('corner-shape', 'squircle'),
      curve: getComputedStyle(card).getPropertyValue('corner-shape'),
      outerOverflow: getComputedStyle(card).overflow,
      clip: Boolean(clip),
      clipCurve:
        clip && getComputedStyle(clip).getPropertyValue('corner-shape'),
      rtlLeft: rtl.borderTopLeftRadius,
      rtlRight: rtl.borderTopRightRadius,
      fixedChildHeight: document
        .querySelector('[data-testid="shape-fixed-child"]')
        .getBoundingClientRect().height,
      initialsHasShape: Boolean(
        document.querySelector('[data-testid="shape-initials"] svg path'),
      ),
    };
  });
  assert.equal(geometry.outerOverflow, 'visible');
  assert.equal(geometry.clip, true);
  assert.equal(geometry.fixedChildHeight, 120);
  assert.equal(geometry.initialsHasShape, true);
  assert.equal(geometry.rtlLeft, '0px');
  assert.equal(geometry.rtlRight, '32px');
  if (geometry.supported) {
    assert.equal(geometry.curve, 'squircle');
    assert.equal(geometry.clipCurve, 'squircle');
  }
  await page.goto(`${base}/iframe.html?id=base-shapes--many&viewMode=story`, {
    waitUntil: 'networkidle0',
  });
  await page.waitForSelector('[data-testid="shape-many"] svg', {
    timeout: 30000,
  });
  const ids = await page.$$eval(
    '[data-testid="shape-many"] svg [id]',
    (nodes) => nodes.map((node) => node.id),
  );
  assert.ok(ids.length >= 100, `Expected 100 border clips, got ${ids.length}`);
  assert.equal(
    new Set(ids).size,
    ids.length,
    'SVG identifiers collide across instances',
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      browser: await browser.version(),
      thickness,
      geometry,
      uniqueSvgIds: ids.length,
    }),
  );
} finally {
  await browser.close();
}
