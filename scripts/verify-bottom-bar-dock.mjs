/** Same editable node, collision-free reversible docking and retained navigation. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const artifacts = process.env.ARTIFACT_DIR ?? '.local/bottom-bar-dock/browser';
await mkdir(artifacts, { recursive: true });
const reports = [];
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 800 },
    reducedMotion: 'no-preference',
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const url = `${process.env.STORYBOOK_URL ?? 'http://localhost:6014'}/iframe.html?id=base-bottom-bar--docked-editor&viewMode=story`;
  for (const direction of ['ltr', 'rtl']) {
    for (const height of [44, 104]) {
      await page.goto(url);
      await page.getByTestId('dock-editor').waitFor();
      await page.evaluate((direction) => {
        document.documentElement.dir = direction;
      }, direction);
      if (height === 104) {
        const before = await page.getByTestId('dock-editor').getAttribute('data-commits');
        await page.getByTestId('dock-height').click();
        await page.waitForFunction(
          () =>
            document.querySelector('[data-testid="dock-editor"]').getBoundingClientRect().height >=
            103.9,
        );
        const after = await page.getByTestId('dock-editor').getAttribute('data-commits');
        assert.equal(after, before, 'animated editor height performs no React commit in BottomBar');
      }
      await page.getByTestId('dock-editor').fill('A retained reply');
      const frames = await page.evaluate(async () => {
        const input = document.querySelector('[data-testid="dock-editor"]');
        const nav = document.querySelector('[data-testid="dock-bar-navigation"]');
        window.dockInput = input;
        input.focus();
        const read = () => ({
          editor: input.getBoundingClientRect().toJSON(),
          nav: nav.getBoundingClientRect().toJSON(),
          same: document.querySelector('[data-testid="dock-editor"]') === input,
          focus: document.activeElement === input,
          value: input.value,
        });
        const frames = [read()];
        document.querySelector('[data-testid="dock-toggle"]').click();
        for (let i = 0; i < 36; i++) {
          await new Promise(requestAnimationFrame);
          frames.push(read());
        }
        return frames;
      });
      const first = frames[0],
        last = frames.at(-1);
      assert.ok(first.nav.y >= first.editor.bottom + 8, 'expanded editor sits above navigation');
      assert.ok(
        Math.abs(last.nav.width - 44) < 1 && Math.abs(last.nav.height - 44) < 1,
        'navigation folds to one 44px target',
      );
      assert.ok(
        Math.abs(last.editor.bottom - last.nav.bottom) < 1,
        'editor and active destination share the bottom row',
      );
      assert.equal(Math.round(last.editor.height), height);
      assert.ok(
        direction === 'ltr'
          ? last.editor.x >= last.nav.right + 9
          : last.editor.right <= last.nav.x - 9,
      );
      assert.ok(
        frames.some(
          (frame) => frame.editor.y > first.editor.y + 3 && frame.editor.y < last.editor.y - 3,
        ),
        'editor follows a real intermediate trajectory',
      );
      for (const frame of frames) {
        assert.ok(
          frame.same && frame.focus && frame.value === 'A retained reply',
          'input, draft and focus survive every frame',
        );
        const overlapX =
          Math.min(frame.editor.right, frame.nav.right) - Math.max(frame.editor.x, frame.nav.x);
        const overlapY =
          Math.min(frame.editor.bottom, frame.nav.bottom) - Math.max(frame.editor.y, frame.nav.y);
        assert.ok(overlapX <= 1 || overlapY <= 1, 'navigation and editor never collide');
      }
      assert.equal(
        await page.getByRole('tab').count(),
        1,
        'hidden destinations leave the accessibility tree',
      );
      await page.getByRole('tab', { name: 'Explore', exact: true }).click();
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="dock-bar-navigation"]').getBoundingClientRect()
            .width > 300,
      );
      assert.equal(await page.getByRole('tab').count(), 4, 'active circle opens all destinations');
      assert.equal(await page.getByTestId('dock-editor').inputValue(), 'A retained reply');
      const activeTab = await page.getByRole('tab', { name: 'Explore', exact: true }).boundingBox();
      await page.mouse.move(activeTab.x + activeTab.width / 2, activeTab.y + activeTab.height / 2);
      await page.mouse.down();
      await page.waitForFunction(
        () => document.querySelector('[data-testid="dock-long-press"]').textContent === 'search',
      );
      await page.mouse.up();
      await page.getByTestId('dock-compact').click();
      await page.getByTestId('dock-editor').focus();
      await page.setViewportSize({ width: 1000, height: 800 });
      await page.getByTestId('dock-bar-navigation').waitFor({ state: 'hidden' });
      assert.ok(
        await page.evaluate(
          () =>
            window.dockInput === document.querySelector('[data-testid="dock-editor"]') &&
            document.activeElement === window.dockInput,
        ),
        'desktop keeps the same focused editor',
      );
      await page.setViewportSize({ width: 390, height: 800 });
      await page.getByTestId('dock-bar-navigation').waitFor({ state: 'visible' });
      await page.screenshot({ path: `${artifacts}/${direction}-${height}.png` });
      reports.push({ direction, height, frames });
    }
  }
  await page.goto(url);
  await page.getByTestId('dock-editor').waitFor();
  const reverse = await page.evaluate(async () => {
    const input = document.querySelector('[data-testid="dock-editor"]');
    input.focus();
    const toggle = document.querySelector('[data-testid="dock-toggle"]');
    toggle.click();
    const started = performance.now();
    let reversed = false;
    const frames = [];
    for (let i = 0; i < 40; i++) {
      await new Promise(requestAnimationFrame);
      if (!reversed && performance.now() - started > 100) {
        toggle.click();
        reversed = true;
      }
      frames.push({
        rect: input.getBoundingClientRect().toJSON(),
        same: document.querySelector('[data-testid="dock-editor"]') === input,
        focus: document.activeElement === input,
      });
    }
    return frames;
  });
  assert.ok(reverse.every((frame) => frame.same && frame.focus));
  assert.ok(
    Math.abs(reverse.at(-1).rect.x - reverse[0].rect.x) < 2,
    'mid-motion reversal returns to expanded position',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByTestId('dock-toggle').click();
  await page.waitForFunction(
    () =>
      Math.abs(
        document.querySelector('[data-testid="dock-bar-navigation"]').getBoundingClientRect()
          .width - 44,
      ) < 1,
  );
  assert.deepEqual(errors, []);
  await writeFile(
    `${artifacts}/report.json`,
    JSON.stringify({ reports, reverse, errors }, null, 2),
  );
  console.log(
    'PASS: dock trajectories, no overlap, 44/104px editor, focus/draft identity, RTL, responsive ownership, rapid reversal and reduced motion.',
  );
} finally {
  await browser.close();
}
