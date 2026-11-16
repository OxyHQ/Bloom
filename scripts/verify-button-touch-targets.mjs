/** Real coarse-pointer layout, edge hit testing and live modality changes. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let puppeteer;
for (const module of ['puppeteer-core', '/home/nate/Oxy/Homiio/node_modules/puppeteer-core']) {
  try {
    puppeteer = require(module);
    break;
  } catch {}
}
if (!puppeteer) throw Error('Install puppeteer-core to run browser checks.');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
try {
  for (const mode of ['light', 'dark'])
    for (const width of [390, 1100]) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewport({ width, height: 1700, hasTouch: false });
      await page.goto(
        `${base}/iframe.html?id=components-actions-button-touch-targets--targets&viewMode=story&globals=theme:${mode}`,
        { waitUntil: 'networkidle0' },
      );
      await page.waitForSelector('[data-testid="ltr-md-text"]');
      const read = () =>
        page.$$eval('[data-testid^="ltr-"],[data-testid^="rtl-"]', (nodes) =>
          nodes.map((node) => {
            const box = node.getBoundingClientRect();
            return {
              id: node.dataset.testid,
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
              direction: getComputedStyle(node).direction,
              paintHeight: Number.parseFloat(getComputedStyle(node, '::before').height),
              paintWidth: Number.parseFloat(getComputedStyle(node, '::before').width),
            };
          }),
        );
      const fine = await read();
      for (const [size, height] of [
        ['xs', 24],
        ['sm', 32],
        ['md', 36],
        ['lg', 44],
      ])
        assert.equal(fine.find((row) => row.id === `ltr-${size}-text`).height, height);
      await page.focus('[data-testid="ltr-md-text"]');
      await page.evaluate(() => {
        window.__targetButton = document.activeElement;
      });
      const cdp = await page.createCDPSession();
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      await page.waitForFunction(
        () =>
          matchMedia('(pointer: coarse)').matches &&
          document.querySelector('[data-testid="ltr-md-text"]').getBoundingClientRect().height >=
            44,
      );
      assert.equal(
        await page.evaluate(() => window.__targetButton === document.activeElement),
        true,
        'modality retains node and focus',
      );
      const coarse = await read();
      assert.equal(coarse.length, 28);
      for (const row of coarse) {
        assert.ok(row.width >= 44 && row.height >= 44, `${row.id}: ${row.width}×${row.height}`);
        assert.equal(row.direction, row.id.startsWith('rtl-') ? 'rtl' : 'ltr');
      }
      for (const direction of ['ltr', 'rtl'])
        for (const [size, expected] of [
          ['xs', 24],
          ['sm', 32],
          ['md', 36],
          ['lg', 44],
        ]) {
          const text = coarse.find((row) => row.id === `${direction}-${size}-text`);
          const icon = coarse.find((row) => row.id === `${direction}-${size}-icon`);
          assert.equal(text.paintHeight, expected, `${text.id} visual height`);
          assert.equal(icon.paintHeight, expected, `${icon.id} visual height`);
          assert.equal(icon.paintWidth, expected, `${icon.id} visual width`);
        }
      const groups = await page.$$eval('.bloom-surface.bloom-button-group-touch-paint', (nodes) =>
        nodes.map((node) => ({
          target: node.getBoundingClientRect().height,
          paint: Number.parseFloat(getComputedStyle(node, '::before').height),
        })),
      );
      assert.equal(groups.length, 2);
      for (const group of groups) {
        assert.equal(group.target, 44);
        assert.equal(group.paint, 24, 'xs group keeps its visual size');
      }
      for (let i = 0; i < coarse.length; i++)
        for (let j = i + 1; j < coarse.length; j++) {
          const a = coarse[i],
            b = coarse[j];
          const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
          const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
          assert.ok(overlapX <= 0.5 || overlapY <= 0.5, `overlapping targets ${a.id}/${b.id}`);
        }
      // Actual touchscreen taps at the newly available bottom/side edges. No
      // element.click shortcut: a neighbour stealing the hit changes the result.
      for (const row of coarse)
        for (const [x, y] of [
          [row.x + row.width / 2, row.y + row.height - 2],
          [row.x + 2, row.y + row.height / 2],
          [row.x + row.width - 2, row.y + row.height / 2],
        ]) {
          await page.touchscreen.tap(x, y);
          assert.equal(
            await page.$eval('[data-testid="target-result"]', (node) => node.textContent),
            row.id,
          );
        }
      const long = await page.$eval('[data-testid="ltr-long"]', (node) => ({
        width: node.clientWidth,
        content: node.scrollWidth,
        height: node.getBoundingClientRect().height,
      }));
      assert.ok(
        long.content <= long.width + 1 && long.height > 44,
        'long label wraps without horizontal clipping',
      );
      // A CSS-authored border changes the absolute containing box. Resolve the
      // actual pseudo styles onto a temporary empty element so its painted box
      // can be measured, including logical insets/translate in both directions.
      const authoredPaint = await page.evaluate(() => {
        const sheet = document.createElement('style');
        sheet.textContent =
          '.verify-authored-paint { height:44px!important; width:52px!important; border:4px solid blue!important; }';
        document.head.append(sheet);
        const result = ['ltr', 'rtl'].map((direction) => {
          const host = document.querySelector(`[data-testid="${direction}-md-icon"]`);
          host.classList.add('verify-authored-paint');
          const styles = getComputedStyle(host, '::before');
          const probe = document.createElement('span');
          for (const property of styles)
            probe.style.setProperty(property, styles.getPropertyValue(property));
          probe.style.visibility = 'hidden';
          host.append(probe);
          const outer = host.getBoundingClientRect(),
            paint = probe.getBoundingClientRect();
          const geometry = {
            direction,
            width: paint.width,
            height: paint.height,
            dx: paint.x - outer.x,
            dy: paint.y - outer.y,
          };
          probe.remove();
          host.classList.remove('verify-authored-paint');
          return geometry;
        });
        sheet.remove();
        return result;
      });
      for (const paint of authoredPaint) {
        assert.equal(paint.width, 52, `${paint.direction} authored paint width`);
        assert.equal(paint.height, 44, `${paint.direction} authored paint height`);
        assert(
          Math.abs(paint.dx) < 0.1 && Math.abs(paint.dy) < 0.1,
          `${paint.direction} authored paint stays centered`,
        );
      }
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
      await page.waitForFunction(
        () =>
          !matchMedia('(pointer: coarse)').matches &&
          document.querySelector('[data-testid="ltr-md-text"]').getBoundingClientRect().height ===
            36,
      );
      assert.equal(
        await page.evaluate(
          () => window.__targetButton === document.querySelector('[data-testid="ltr-md-text"]'),
        ),
        true,
      );
      assert.deepEqual(
        (await read()).map(({ id, width, height }) => ({ id, width, height })),
        fine.map(({ id, width, height }) => ({ id, width, height })),
        'fine-pointer geometry restored',
      );
      assert.deepEqual(errors, []);
      console.log(
        JSON.stringify({
          mode,
          width,
          targets: coarse.length,
          edgeTaps: coarse.length * 3,
          noOverlap: true,
          scope: true,
          rtl: true,
          liveModality: true,
          longLabel: long,
          errors,
        }),
      );
      await page.close();
    }
} finally {
  await browser.close();
}
