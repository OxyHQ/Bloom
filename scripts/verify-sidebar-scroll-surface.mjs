/** Whole-sidebar ownership, corner containment and painted edge-color regression. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer-core');
const { PNG } = require('pngjs');
const output = process.env.BLOOM_SIDEBAR_REVIEW ?? '.local/sidebar-scroll-review';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : { channel: 'chrome' }),
  headless: true,
  args: ['--no-sandbox'],
});
const report = [],
  errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewport({ width: 1000, height: 800 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  for (const story of [
    'blocks-sidebar--scroll-overflow',
    'blocks-sidebar--default',
    'blocks-sidebar--rail',
    'agents-conversation-sidebar--default',
  ]) {
    const url = new URL('iframe.html', process.env.STORYBOOK_URL ?? 'http://localhost:6006');
    url.searchParams.set('id', story);
    url.searchParams.set('viewMode', 'story');
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[role="complementary"] [data-bloom-scroll-area]', {
      timeout: 60000,
    });
    const measurement = await page.evaluate(() => {
      const side = document.querySelector('[role="complementary"]');
      const owners = side.querySelectorAll('[data-bloom-scroll-area]'),
        owner = owners[0];
      return {
        count: owners.length,
        side: side.getBoundingClientRect().toJSON(),
        owner: owner.getBoundingClientRect().toJSON(),
        headerInside:
          !side.querySelector('[data-testid$="-fixed-header"]') ||
          owner.contains(side.querySelector('[data-testid$="-fixed-header"]')),
        footerInside:
          !side.querySelector('[data-testid$="-sticky-footer"]') ||
          owner.contains(side.querySelector('[data-testid$="-sticky-footer"]')),
      };
    });
    assert.equal(measurement.count, 1, story + ' must own exactly one scroll viewport');
    assert(
      measurement.headerInside && measurement.footerInside,
      story + ' chrome belongs inside the viewport',
    );
    assert(
      Math.abs(measurement.owner.left - measurement.side.left) <= 2 &&
        Math.abs(measurement.owner.right - measurement.side.right) <= 2,
      story + ' whole width',
    );
    assert(
      Math.abs(measurement.owner.height - measurement.side.height) <= 2,
      story + ' whole height',
    );
    await page.screenshot({ path: `${output}/${story}-normal.png` });
    // Force overflow through real layout, not mocked scroll metrics, then drive the actual owner.
    await page.evaluate(() => {
      const side = document.querySelector('[role="complementary"]');
      side.style.height = '180px';
      const owner = side.querySelector('[data-bloom-scroll-area]');
      owner.scrollTop = 70;
      owner.dispatchEvent(new Event('scroll'));
    });
    await new Promise((r) => setTimeout(r, 350));
    const range = await page.evaluate(() => {
      const n = document.querySelector('[role="complementary"] [data-bloom-scroll-area]');
      n.scrollTop = 0;
      return n.scrollHeight - n.clientHeight;
    });
    let scrollStyleReads = 0;
    if (range > 2) {
      const point = await page.evaluate(() => {
        const n = document.querySelector('[role="complementary"] [data-bloom-scroll-area]');
        const r = n.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + 8 };
      });
      await page.mouse.move(point.x, point.y);
      await new Promise((r) => setTimeout(r, 100));
      await page.evaluate(() => {
        window.sidebarOriginalStyle = window.getComputedStyle;
        window.sidebarPaintStyleReads = 0;
        window.getComputedStyle = function (...args) {
          if (new Error().stack?.includes('use-painted-surface-fill'))
            window.sidebarPaintStyleReads++;
          return window.sidebarOriginalStyle.apply(this, args);
        };
      });
      await page.mouse.wheel({ deltaY: 100 });
      await new Promise((r) => setTimeout(r, 250));
      const moved = await page.$eval(
        '[role="complementary"] [data-bloom-scroll-area]',
        (n) => n.scrollTop,
      );
      assert(moved > 0, story + ' wheel over header must scroll whole sidebar');
      scrollStyleReads = await page.evaluate(() => {
        window.getComputedStyle = window.sidebarOriginalStyle;
        return window.sidebarPaintStyleReads;
      });
      assert.equal(
        scrollStyleReads,
        0,
        story + ' material matching must not read styles during wheel',
      );
      await page.$eval(
        '[role="complementary"] [data-bloom-scroll-area]',
        (n) => (n.scrollTop = n.scrollHeight),
      );
      await new Promise((r) => setTimeout(r, 100));
      const footerPoint = await page.$eval(
        '[role="complementary"] [data-bloom-scroll-area]',
        (n) => {
          const r = n.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.bottom - 8, offset: n.scrollTop };
        },
      );
      await page.mouse.move(footerPoint.x, footerPoint.y);
      await page.mouse.wheel({ deltaY: -100 });
      await new Promise((r) => setTimeout(r, 250));
      const back = await page.$eval(
        '[role="complementary"] [data-bloom-scroll-area]',
        (n) => n.scrollTop,
      );
      assert(back < footerPoint.offset, story + ' wheel over footer must scroll same owner');
      await page.$eval(
        '[role="complementary"] [data-bloom-scroll-area]',
        (n) => (n.scrollTop = 70),
      );
      await new Promise((r) => setTimeout(r, 200));
    }

    await page.screenshot({ path: `${output}/${story}.png` });
    const geometry = await page.evaluate(() => {
      const side = document.querySelector('[role="complementary"]'),
        owner = side.querySelector('[data-bloom-scroll-area]');
      return {
        side: side.getBoundingClientRect().toJSON(),
        owner: owner.getBoundingClientRect().toJSON(),
        radius: parseFloat(getComputedStyle(side).borderTopLeftRadius) || 0,
        range: owner.scrollHeight - owner.clientHeight,
        edges: [
          ...side.querySelectorAll('[data-testid$="-fade-top"],[data-testid$="-fade-bottom"]'),
        ].map((n) => ({
          id: n.dataset.testid,
          stopColor: getComputedStyle(n.querySelector('stop')).stopColor,
          rect: n.getBoundingClientRect().toJSON(),
          opacity: Number(getComputedStyle(n).opacity),
        })),
      };
    });
    assert(Math.abs(geometry.owner.height-geometry.side.height)<=2,story+' resized owner must match sidebar height');
    assert(geometry.owner.top>=geometry.side.top-1 && geometry.owner.bottom<=geometry.side.bottom+1,story+' resized owner escapes sidebar');
    for (const edge of geometry.edges)
      assert(
        edge.rect.left >= geometry.side.left - 1 && edge.rect.right <= geometry.side.right + 1,
        story + ' fade leaks sideways',
      );
    const before = PNG.sync.read(await page.screenshot());
    await page.evaluate(() =>
      document
        .querySelectorAll('[data-testid$="-fade-top"],[data-testid$="-fade-bottom"]')
        .forEach((n) => (n.style.visibility = 'hidden')),
    );
    const after = PNG.sync.read(await page.screenshot());
    let outsideChanges = 0;
    const r = geometry.side,
      radius = geometry.radius;
    for (
      let y = Math.max(0, Math.floor(r.top));
      y < Math.min(before.height, Math.ceil(r.bottom));
      y++
    )
      for (
        let x = Math.max(0, Math.floor(r.left));
        x < Math.min(before.width, Math.ceil(r.right));
        x++
      ) {
        const cx = Math.max(r.left + radius, Math.min(r.right - radius, x + 0.5));
        const cy = Math.max(r.top + radius, Math.min(r.bottom - radius, y + 0.5));
        if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= radius + 1) continue;
        const i = (y * before.width + x) * 4;
        if ([0, 1, 2].some((c) => Math.abs(before.data[i + c] - after.data[i + c]) > 2))
          outsideChanges++;
      }
    assert.equal(outsideChanges, 0, story + ' fade paints outside rounded material');
    await page.evaluate(() => {
      document.querySelector('[role="complementary"] [data-bloom-scroll-area]').style.visibility =
        'hidden';
      document
        .querySelectorAll('[data-testid$="-fade-top"],[data-testid$="-fade-bottom"]')
        .forEach((n) => (n.style.visibility = 'visible'));
    });
    const painted = PNG.sync.read(await page.screenshot());
    await page.evaluate(() =>
      document
        .querySelectorAll('[data-testid$="-fade-top"],[data-testid$="-fade-bottom"]')
        .forEach((n) => (n.style.visibility = 'hidden')),
    );
    const bare = PNG.sync.read(await page.screenshot());
    const colorSamples = geometry.edges
      .filter((edge) => edge.opacity > 0.99)
      .map((edge) => {
        const x = Math.floor((geometry.side.left + geometry.side.right) / 2);
        const y = Math.floor((geometry.side.top + geometry.side.bottom) / 2);
        const i = (y * bare.width + x) * 4;
        const actual = edge.stopColor
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number);
        const background = [...bare.data.slice(i, i + 3)];
        assert(
          actual.every((v, k) => Math.abs(v - background[k]) <= 1),
          story + ' fade does not match painted body: ' + JSON.stringify({ actual, background }),
        );
        return { actual, background };
      });
    report.push({
      story,
      initial: measurement,
      ...geometry,
      outsideChanges,
      colorSamples,
      scrollStyleReads,
    });
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/report.json`, JSON.stringify({ report, errors }, null, 2));
  console.log(
    `PASS ${report.length} sidebar compositions: full viewport, shared sticky ownership and rounded edge pixels`,
  );
} finally {
  await browser.close();
}
