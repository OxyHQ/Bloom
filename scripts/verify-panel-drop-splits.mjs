/** Proportional splits keep their ratio through a window resize; drop zones stage and resolve. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6007';
const browser = await chromium.launch();
try {
  for (const dir of ['ltr', 'rtl']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${base}/iframe.html?id=blocks-app-shell--proportional-split&viewMode=story`);
    await page.getByTestId('proportional-split-panels-left').waitFor();
    if (dir === 'rtl') {
      await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);
    const widths = () =>
      page.evaluate(() =>
        ['left', 'stack', 'right'].map(
          (id) =>
            document
              .querySelector(`[data-testid="proportional-split-panels-${id}"]`)
              .getBoundingClientRect().width,
        ),
      );
    const [a0, b0, c0] = await widths();
    assert.ok(Math.abs(a0 - b0) < 1 && Math.abs(b0 - c0) < 1, `equal thirds: ${a0} ${b0} ${c0}`);
    const grip = page.getByTestId('proportional-split-panels-left-divider');
    const box = await grip.boundingBox();
    const sign = dir === 'rtl' ? -1 : 1;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    for (let step = 1; step <= 10; step++)
      await page.mouse.move(box.x + box.width / 2 + sign * 15 * step, box.y + box.height / 2);
    await page.mouse.up();
    await page.waitForTimeout(500);
    const [a1, b1, c1] = await widths();
    assert.ok(Math.abs(a1 - (a0 + 150)) < 2, `dragged 150: ${a0} → ${a1}`);
    assert.ok(Math.abs(b1 - (b0 - 150)) < 2, `neighbour gave 150: ${b0} → ${b1}`);
    assert.ok(Math.abs(c1 - c0) < 1, `third pane untouched: ${c0} → ${c1}`);
    await page.setViewportSize({ width: 1000, height: 900 });
    await page.waitForTimeout(600);
    const [a2, b2, c2] = await widths();
    for (const [before, after, name] of [
      [a1 / (a1 + b1 + c1), a2 / (a2 + b2 + c2), 'left'],
      [b1 / (a1 + b1 + c1), b2 / (a2 + b2 + c2), 'stack'],
    ])
      assert.ok(
        Math.abs(before - after) < 0.003,
        `${dir} ${name} keeps its share: ${before} → ${after}`,
      );
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false);
    console.log(
      `PASS ${dir} split: ${a1.toFixed(1)}/${b1.toFixed(1)}/${c1.toFixed(1)} at 1440 → ${a2.toFixed(1)}/${b2.toFixed(1)}/${c2.toFixed(1)} at 1000`,
    );
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${base}/iframe.html?id=blocks-app-shell--panel-drop-zones&viewMode=story`);
  await page.getByTestId('drop-zones-panels-a').waitFor();
  const seen = new Map();
  const started = Date.now();
  while (Date.now() - started < 6500) {
    const sample = await page.evaluate(() =>
      [...document.querySelectorAll('[data-bloom-panel-drop-stage]')].map((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return {
          stage: node.getAttribute('data-bloom-panel-drop-stage'),
          width: rect.width,
          background: style.backgroundColor,
          overlayEvents: getComputedStyle(node.parentElement).pointerEvents,
        };
      }),
    );
    for (const zone of sample) if (!seen.has(zone.stage)) seen.set(zone.stage, zone);
    assert.equal(sample.length, 4, 'two targets on each pane');
    assert.ok(sample.every((zone) => zone.overlayEvents === 'none'));
    await page.waitForTimeout(40);
  }
  assert.ok(seen.has('grown') && seen.has('active'), `stages seen: ${[...seen.keys()]}`);
  assert.notEqual(seen.get('active').background, seen.get('grown').background);
  assert.ok(seen.get('active').width > seen.get('grown').width);
  console.log(
    `PASS drop zones: stages ${[...seen.keys()].join(', ')}; grown ${seen.get('grown').width.toFixed(1)}px, active ${seen.get('active').width.toFixed(1)}px`,
  );
  await page.close();
} finally {
  await browser.close();
}
