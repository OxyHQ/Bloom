/** Real paint and pointer regression: decorative edges must remain below the scrollbar. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url),
  puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer-core'),
  { PNG } = require('pngjs');
const output = '.local/scroll-surface-stacking';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : { channel: 'chrome' }),
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 700 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(
    `${process.env.STORYBOOK_URL ?? 'http://localhost:6006'}/iframe.html?id=blocks-sidebar--scroll-overflow&viewMode=story`,
    { waitUntil: 'domcontentloaded' },
  );
  await page.waitForSelector('[role="complementary"] [data-bloom-scrollbar-thumb]');
  await page.evaluate(() => {
    const side = document.querySelector('[role="complementary"]');
    side.style.height = '180px';
    const viewport = side.querySelector('[data-bloom-scroll-area]');
    viewport.scrollTop = 40;
  });
  await new Promise((r) => setTimeout(r, 450));
  const before = await page.evaluate(() => {
    const side = document.querySelector('[role="complementary"]'),
      viewport = side.querySelector('[data-bloom-scroll-area]'),
      thumb = side.querySelector('[data-bloom-scrollbar-thumb]'),
      track = thumb.parentElement,
      fade = side.querySelector('[data-testid$="-fade-top"]');
    const rect = thumb.getBoundingClientRect();
    return {
      scroll: viewport.scrollTop,
      rect: rect.toJSON(),
      sameHost: track.parentElement === viewport.parentElement,
      fadeHost: fade.parentElement.parentElement === viewport.parentElement,
    };
  });
  assert.ok(
    before.sameHost && before.fadeHost,
    'Viewport, decoration and scrollbar must share the stacking owner',
  );
  const x = before.rect.x + before.rect.width / 2,
    y = before.rect.y + before.rect.height / 2;
  await page.mouse.move(x, y);
  await new Promise((r) => setTimeout(r, 150));
  assert.ok(
    await page.evaluate(
      ({ x, y }) => !!document.elementFromPoint(x, y)?.closest('[data-bloom-scrollbar]'),
      { x, y },
    ),
    'Real pointer reaches scrollbar over the fade',
  );
  await page.screenshot({ path: `${output}/actual.png` });
  await page.mouse.down();
  await page.mouse.move(x, y + 55, { steps: 12 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 200));
  const after = await page.$eval(
    '[role="complementary"] [data-bloom-scroll-area]',
    (n) => n.scrollTop,
  );
  assert.ok(after > before.scroll + 10, 'Real thumb drag scrolls its owner');
  // A saturated diagnostic thumb makes paint ordering measurable, independently of theme contrast.
  await page.evaluate(() => {
    const side = document.querySelector('[role="complementary"]');
    side.querySelector('[data-bloom-scroll-area]').scrollTop = 40;
  });
  await new Promise((r) => setTimeout(r, 250));
  const sample = await page.evaluate(() => {
    const thumb = document.querySelector('[role="complementary"] [data-bloom-scrollbar-thumb]');
    thumb.style.backgroundColor = 'rgb(20, 240, 50)';
    thumb.style.opacity = '1';
    thumb.style.transition = 'none';
    const r = thumb.getBoundingClientRect();
    return { x: Math.floor(r.x + r.width / 2), y: Math.floor(r.y + r.height / 2) };
  });
  const pixel = async () => {
    const png = PNG.sync.read(Buffer.from(await page.screenshot()));
    const i = (sample.y * png.width + sample.x) * 4;
    return Array.from(png.data.slice(i, i + 3));
  };
  const front = await pixel();
  assert.deepEqual(front, [20, 240, 50], 'Scrollbar paint remains above the fade');
  await page.evaluate(() => {
    const fade = document.querySelector('[role="complementary"] [data-testid$="-fade-top"]'),
      decoration = fade.parentElement,
      area = decoration.parentElement;
    area.parentElement.append(decoration);
  });
  const obscured = await pixel();
  assert.notDeepEqual(
    obscured,
    [20, 240, 50],
    'Negative control: moving decoration outside the scrollbar owner reproduces the covered thumb',
  );
  const report = {
    scrollBefore: before.scroll,
    scrollAfter: after,
    front,
    obscured,
    pointer: true,
  };
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
