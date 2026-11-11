import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const dir = '.local/dock-focus-motion';
await mkdir(dir, { recursive: true });
const reports = [];
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(
    `${process.env.STORYBOOK_URL ?? 'http://localhost:6014'}/iframe.html?id=base-bottom-bar--focused-composer&viewMode=story`,
  );
  await page.locator('textarea').waitFor();
  for (const folded of [false, true]) {
    await page.getByTestId(folded ? 'focus-dock-fold' : 'focus-dock-unfold').click();
    for (const focus of [true, false]) {
      const frames = await page.evaluate(async (focus) => {
        const input = document.querySelector('textarea');
        const outside = document.querySelector('[data-testid="focus-dock-outside"]');
        const row = document.querySelector('[data-testid="focus-dock-row"]');
        const bar = document.querySelector('[data-testid="focus-dock"]');
        const action = document.querySelector('[data-testid="focus-dock-action"]');
        const read = () => ({
          y: input.getBoundingClientRect().y,
          x: input.getBoundingClientRect().x,
          height: bar.getBoundingClientRect().height,
          actionHeight: action.getBoundingClientRect().height,
          padding: parseFloat(getComputedStyle(row).paddingBottom),
          same: document.querySelector('textarea') === input,
          focused: document.activeElement === input,
        });
        const frames = [read()];
        (focus ? input : outside).focus();
        for (let i = 0; i < 34; i++) {
          await new Promise(requestAnimationFrame);
          frames.push(read());
        }
        return frames;
      }, focus);
      reports.push({ folded, focus, frames });
      await writeFile(`${dir}/frames.json`, JSON.stringify(reports, null, 2));
      const first = frames[0];
      const last = frames.at(-1);
      assert.ok(
        frames.every((f) => f.same && (focus ? f.focused || f === first : true)),
        'input and focus retained',
      );
      assert.ok(
        Math.abs(last.padding - (focus ? 0 : 68)) < 0.1,
        'final navigation footprint exact',
      );
      const lo = Math.min(first.y, last.y) - 2;
      const hi = Math.max(first.y, last.y) + 2;
      assert.ok(
        frames.every((f) => f.y >= lo && f.y <= hi),
        `no focus overshoot: ${JSON.stringify({ folded, focus, lo, hi, ys: frames.map((f) => f.y) })}`,
      );
      const direction = Math.sign(last.y - first.y);
      for (let i = 1; i < frames.length; i++)
        assert.ok(
          (frames[i].y - frames[i - 1].y) * direction >= -1.5,
          'continuous reversible trajectory',
        );
      assert.ok(
        frames.some((f) => f.padding > 1 && f.padding < 67),
        'footprint has intermediate geometry',
      );
    }
  }
  // Reverse before either CSS transition finishes: no replacement input or stale completion.
  const reversed = await page.evaluate(async () => {
    const input = document.querySelector('textarea');
    const outside = document.querySelector('[data-testid="focus-dock-outside"]');
    const row = document.querySelector('[data-testid="focus-dock-row"]');
    input.focus();
    for (let i = 0; i < 5; i++) await new Promise(requestAnimationFrame);
    outside.focus();
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    input.focus();
    for (let i = 0; i < 35; i++) await new Promise(requestAnimationFrame);
    return {
      same: document.querySelector('textarea') === input,
      focused: document.activeElement === input,
      padding: parseFloat(getComputedStyle(row).paddingBottom),
    };
  });
  assert.deepEqual(reversed, { same: true, focused: true, padding: 0 });
  await page.getByTestId('focus-dock-outside').focus();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reduced = await page.evaluate(async () => {
    const input = document.querySelector('textarea');
    input.focus();
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    return {
      padding: getComputedStyle(document.querySelector('[data-testid="focus-dock-row"]'))
        .paddingBottom,
      animations: document.querySelector('[data-testid="focus-dock-row"]').getAnimations().length,
    };
  });
  assert.equal(reduced.padding, '0px');
  assert.equal(reduced.animations, 0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(
    `${process.env.STORYBOOK_URL ?? 'http://localhost:6014'}/iframe.html?id=base-collapsible--lifecycle&viewMode=story`,
  );
  await page.getByTestId('lifecycle-toggle').click();
  await page.waitForFunction(
    () => document.querySelector('[data-testid="lifecycle-body"]').dataset.settled === 'true',
  );
  await page.getByTestId('lifecycle-input').fill('Retained across interrupted close');
  const lifecycle = await page.evaluate(async () => {
    const toggle = document.querySelector('[data-testid="lifecycle-toggle"]');
    const input = document.querySelector('[data-testid="lifecycle-input"]');
    const panel = document.querySelector('[data-testid="lifecycle-body"]');
    toggle.click();
    for (let i = 0; i < 5; i++) await new Promise(requestAnimationFrame);
    const middleHeight = panel.getBoundingClientRect().height;
    toggle.click();
    for (let i = 0; i < 35; i++) await new Promise(requestAnimationFrame);
    return {
      same: document.querySelector('[data-testid="lifecycle-input"]') === input,
      value: input.value,
      height: panel.getBoundingClientRect().height,
      middleHeight,
    };
  });
  assert.ok(
    lifecycle.same && lifecycle.middleHeight > 0 && lifecycle.middleHeight < lifecycle.height,
  );
  assert.equal(lifecycle.value, 'Retained across interrupted close');
  await page.getByTestId('lifecycle-grow').click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="lifecycle-body"]').getBoundingClientRect().height > 300,
  );
  await page.getByTestId('lifecycle-toggle').click();
  await page.getByTestId('lifecycle-input').waitFor({ state: 'detached' });
  assert.equal(
    (await page.getByTestId('lifecycle-body').boundingBox()).height,
    0,
    'no ghost reserved height after unmount',
  );
  const appearing = await page.evaluate(async () => {
    document.querySelector('[data-testid="lifecycle-appear"]').click();
    const heights = [];
    for (let i = 0; i < 35; i++) {
      await new Promise(requestAnimationFrame);
      heights.push(
        document.querySelector('[data-testid="appearing-body"]').getBoundingClientRect().height,
      );
    }
    return heights;
  });
  assert.ok(appearing.some((height) => height > 1 && height < 119));
  assert.equal(appearing.at(-1), 120);
  await writeFile(
    `${dir}/report.json`,
    JSON.stringify({ reports, reduced, reversed, lifecycle, appearing }, null, 2),
  );
  console.log(
    'PASS dock focus trajectories: expanded/folded, focus/blur, natural footprint and reduced motion',
  );
} finally {
  await browser.close();
}
