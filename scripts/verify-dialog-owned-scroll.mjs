/** A child ScrollView keeps a bounded viewport through each Dialog placement. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const base = process.argv[2] || 'http://localhost:6006';
try {
  for (const placement of ['center', 'end', 'bottom'])
    for (const header of [true, false])
      for (const mode of ['light', 'dark']) {
        const page = await browser.newPage({
          viewport:
            placement === 'bottom' ? { width: 390, height: 844 } : { width: 1200, height: 900 },
          reducedMotion: 'reduce',
        });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(
          `${base}/iframe.html?id=base-dialog--owned-scroller${header ? '' : '-without-header'}&viewMode=story&args=placement:${placement}&globals=theme:${mode}`,
        );
        await page
          .getByRole('button', { name: 'Open owned scroller', exact: true })
          .click({ timeout: 120000 });
        const scroll = page.getByTestId('owned-scroll');
        const footer = page.getByTestId('owned-footer');
        await expect(scroll).toBeVisible();
        await expect
          .poll(async () => scroll.evaluate((node) => node.clientHeight))
          .toBeGreaterThan(100);
        const geometry = await scroll.evaluate((node) => ({
          viewport: node.clientHeight,
          content: node.scrollHeight,
        }));
        assert.ok(geometry.content > geometry.viewport + 1000);
        await page.getByRole('button', { name: 'Jump to row', exact: true }).click();
        await expect.poll(async () => scroll.evaluate((node) => node.scrollTop)).toBe(900);
        await scroll.evaluate((node) => {
          node.scrollTop = node.scrollHeight;
        });
        await expect(scroll.getByText('Row 60', { exact: true })).toBeInViewport();
        await expect(footer).toBeInViewport();
        const ancestors = await scroll.evaluate((node) => {
          const sizes = [];
          let parent = node.parentElement;
          while (parent && parent.getAttribute('role') !== 'dialog') {
            if (/auto|scroll/.test(getComputedStyle(parent).overflowY))
              sizes.push(parent.className);
            parent = parent.parentElement;
          }
          return sizes;
        });
        assert.deepEqual(
          ancestors,
          [],
          'an owned scroller must not nest in a disabled or active Dialog ScrollView',
        );
        await page.getByRole('button', { name: 'Done', exact: true }).click();
        await expect(scroll).toHaveCount(0);
        assert.deepEqual(errors, []);
        await page.close();
        console.log({ placement, header, mode, result: 'passed' });
      }
  for (const placement of ['center', 'end', 'bottom']) {
    const page = await browser.newPage({
      viewport: placement === 'bottom' ? { width: 390, height: 844 } : { width: 1200, height: 900 },
    });
    await page.goto(
      `${base}/iframe.html?id=base-dialog--owned-scroller-pagination&viewMode=story&args=placement:${placement}`,
    );
    const opener = page.getByRole('button', { name: 'Open paginated content', exact: true });
    for (let attempt = 0; attempt < 2; attempt++) {
      await opener.click({ timeout: 120000 });
      const scroll = page.getByTestId('pagination-scroll');
      await expect(scroll).toBeVisible();
      await expect(
        page.getByRole('dialog').getByRole('button', { name: 'Next page', exact: true }),
      ).not.toBeFocused();
      const positions = await scroll.evaluate(async (node) => {
        const values = [];
        for (let frame = 0; frame < 24; frame++) {
          await new Promise(requestAnimationFrame);
          values.push(node.scrollTop);
        }
        return values;
      });
      assert.ok(
        positions.every((value) => value === 0),
        'initial focus must not scroll to pagination, including on reopen',
      );
      await page.keyboard.press('Escape');
      await expect(scroll).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
    await page.close();
    console.log({ placement, paginationReopen: 'passed' });
  }
} finally {
  await browser.close();
}
