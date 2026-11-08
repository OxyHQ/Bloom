/** Real focus and wheel checks: clipping bounds, RTL, resize and nested owners. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6134';
const output = resolve(process.env.BLOOM_FOCUS_OUTPUT || '/tmp/bloom-horizontal-focus');
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox'],
});
const report = { cases: [], errors: [] };
async function bounds(locator) {
  return locator.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    let left = 0;
    let right = innerWidth;
    for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) {
      if (/auto|scroll|hidden|clip/.test(getComputedStyle(ancestor).overflowX)) {
        const clip = ancestor.getBoundingClientRect();
        left = Math.max(left, clip.left);
        right = Math.min(right, clip.right);
      }
    }
    return {
      x: rect.x,
      right: rect.right,
      leftClip: left,
      rightClip: right,
      visible: rect.left >= left - 1 && rect.right <= right + 1,
    };
  });
}
try {
  for (const direction of ['ltr', 'rtl'])
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const page = await browser.newPage({ viewport: { width: 700, height: 700 }, reducedMotion });
      page.on('pageerror', (error) => report.errors.push(error.message));
      await page.goto(`${base}/iframe.html?id=base-scroll-area--keyboard-reveal&viewMode=story`);
      const toolbar = page.getByTestId('focus-toolbar');
      await toolbar.waitFor({ timeout: 120000 });
      await page.evaluate((dir) => document.documentElement.setAttribute('dir', dir), direction);
      await page.waitForTimeout(200);
      const outer = page.getByTestId('focus-outer');
      await outer.evaluate((host) => {
        const node = [host, ...host.querySelectorAll('*')].find(
          (n) => getComputedStyle(n).overflowY === 'auto',
        );
        node.scrollTop = 160;
        window.__focusOuter = node;
      });
      const before = await page.evaluate(() => ({
        outer: window.__focusOuter.scrollTop,
        document: scrollY,
      }));
      await toolbar.getByRole('button', { name: 'Views', exact: true }).focus();
      const checks = [];
      for (const label of [
        'Views',
        'Add view',
        'Search',
        'Filter',
        'Sort',
        'Properties',
        'Last tool',
        'Persistent action',
      ]) {
        await page.waitForTimeout(300);
        const target = toolbar.getByRole('button', { name: label, exact: true });
        assert.equal(
          await target.evaluate((node) => node === document.activeElement),
          true,
          `${direction} focused ${label}`,
        );
        const box = await bounds(target);
        checks.push({ label, ...box });
        if (!box.visible) {
          await page.screenshot({ path: join(output, 'failure.png') });
          console.log(
            JSON.stringify(
              await toolbar.evaluate((root) =>
                [...root.querySelectorAll('*')]
                  .filter((n) => getComputedStyle(n).overflowX === 'auto')
                  .map((n) => ({
                    tag: n.tagName,
                    scrollLeft: n.scrollLeft,
                    clientWidth: n.clientWidth,
                    scrollWidth: n.scrollWidth,
                    rect: n.getBoundingClientRect().toJSON(),
                  })),
              ),
            ),
          );
        }
        assert.ok(box.visible, `${direction} ${label}: ${JSON.stringify(box)}`);
        assert.deepEqual(
          await page.evaluate(() => ({ outer: window.__focusOuter.scrollTop, document: scrollY })),
          before,
          'focus moves only its horizontal owner',
        );
        await page.keyboard.press('Tab');
      }
      const last = toolbar.getByRole('button', { name: 'Last tool', exact: true });
      await last.focus();
      await page.getByTestId('focus-toolbar-host').evaluate((node) => (node.style.width = '240px'));
      await page.waitForTimeout(300);
      const resized = await bounds(last);
      assert.ok(resized.visible, `resize ${direction}: ${JSON.stringify(resized)}`);
      const cell = page.getByRole('button', { name: 'Last cell', exact: true });
      await cell.focus();
      await page.waitForTimeout(300);
      const table = await bounds(cell);
      assert.ok(table.visible, `table ${direction}: ${JSON.stringify(table)}`);
      assert.deepEqual(
        await page.evaluate(() => ({ outer: window.__focusOuter.scrollTop, document: scrollY })),
        before,
        'nested table leaves outer scroll unchanged',
      );
      const first = toolbar.getByRole('button', { name: 'Views', exact: true });
      await first.focus();
      await page.waitForTimeout(300);
      const wheelBefore = await first.boundingBox();
      await first.hover();
      await page.mouse.wheel(direction === 'rtl' ? -80 : 80, 0);
      await page.waitForTimeout(300);
      const wheelAfter = await first.boundingBox();
      assert.ok(Math.abs(wheelAfter.x - wheelBefore.x) > 20, 'real horizontal wheel moves owner');
      assert.deepEqual(
        await page.evaluate(() => ({ outer: window.__focusOuter.scrollTop, document: scrollY })),
        before,
        'horizontal wheel leaves outer scroll unchanged',
      );
      await last.focus();
      await page.waitForTimeout(300);
      assert.ok((await bounds(last)).visible, 'focus reveals after manual wheel scroll');
      await page.screenshot({ path: join(output, `${direction}-${reducedMotion}.png`) });
      report.cases.push({
        direction,
        reducedMotion,
        checks,
        resized,
        table,
        wheel: { before: wheelBefore, after: wheelAfter },
        outer: before,
      });
      await page.close();
    }
  assert.deepEqual(report.errors, []);
} finally {
  writeFileSync(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
console.log(JSON.stringify({ cases: report.cases.length, errors: report.errors }));
