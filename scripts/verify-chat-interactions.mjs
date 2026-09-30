/**
 * Run against the live source Storybook. This measures browser layout and CSS
 * transitions, which the RN Jest mocks cannot see.
 * BLOOM_PLAYWRIGHT_MODULE may point to an existing Playwright installation.
 * Usage: node scripts/verify-chat-interactions.mjs [http://localhost:6006]
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const width of [1440, 390, 320]) {
    for (const dir of ['ltr', 'rtl']) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        reducedMotion: width === 320 ? 'reduce' : 'no-preference',
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(
        `${base}/iframe.html?id=ai-multi-agent-chat--default&viewMode=story&args=defaultEditorId:!null`,
      );
      const profile = page.getByTestId('chat-agent-profile');
      await profile.waitFor({ timeout: 60000 });
      await page.evaluate((dir) => {
        document.documentElement.dir = dir;
      }, dir);
      await page.waitForTimeout(100);
      const measure = () =>
        profile.evaluate((el) => {
          const box = el.getBoundingClientRect();
          const header =
            el.parentElement.parentElement.parentElement.getBoundingClientRect();
          return {
            center: box.x + box.width / 2,
            headerCenter: header.x + header.width / 2,
            width: box.width,
            available: header.width - 128,
            height: box.height,
          };
        });
      const first = await measure();
      assert.ok(
        Math.abs(first.center - first.headerCenter) < 1,
        'Profile must be centered independently of side actions',
      );
      assert.equal(
        first.height,
        82,
        '56px artwork overlaps a 28px name pill by 2px',
      );
      await profile.focus();
      await page.keyboard.press('Enter');
      const name = page.getByRole('textbox', {
        name: 'Agent name',
        exact: true,
      });
      await name.waitFor();
      assert.equal(
        await name.inputValue(),
        'landing page designer',
        'Profile opens the selected agent',
      );
      await name.fill(
        'A very long agent name that must fit the available header width',
      );
      await page
        .getByRole('button', { name: 'Close agent editor', exact: true })
        .click();
      if (width === 1440) {
        assert.equal(
          await page.evaluate(() => {
            const field = document.querySelector(
              'input[aria-label="Agent name"]',
            );
            return !!field && !!field.closest('[inert]');
          }),
          true,
          'Closing editor stays mounted but cannot receive focus',
        );
      }
      await page.waitForTimeout(450);
      assert.equal(await profile.getAttribute('aria-expanded'), 'false');
      const long = await measure();
      assert.ok(
        long.width <= long.available + 1,
        'Long names must truncate without colliding with actions',
      );
      assert.ok(
        Math.abs(long.center - long.headerCenter) < 1,
        'Long profile remains centered',
      );
      if (width === 1440) {
        const toolbar = page.getByTestId('multi-agent-chat-toolbar');
        await toolbar.evaluate((el) => {
          const search = el.querySelector('.transition-\\[width\\]');
          window.searchEvents = [];
          for (const type of [
            'transitionrun',
            'transitioncancel',
            'transitionend',
          ]) {
            search.addEventListener(type, (event) => {
              if (event.target === search && event.propertyName === 'width')
                window.searchEvents.push(type);
            });
          }
        });
        await toolbar
          .getByRole('button', { name: 'Search conversations', exact: true })
          .click();
        const input = toolbar.getByPlaceholder('Search conversations…');
        await input.waitFor();
        await page.waitForTimeout(450);
        assert.equal(
          await input.evaluate((el) => document.activeElement === el),
          true,
          'Search receives focus',
        );
        assert.deepEqual(
          await page.evaluate(() => window.searchEvents),
          ['transitionrun', 'transitionend'],
          'Search must have one width animation, without per-frame CSS retargeting',
        );
        await input.fill('security');
        const clear = toolbar.getByRole('button', {
          name: 'Close search',
          exact: true,
        });
        const toolbarBox = await toolbar.boundingBox();
        const clearBox = await clear.boundingBox();
        assert.ok(
          dir === 'rtl'
            ? clearBox.x < toolbarBox.x + toolbarBox.width / 2
            : clearBox.x > toolbarBox.x + toolbarBox.width / 2,
          'Close button mirrors',
        );
        await input.press('Escape');
        await page.waitForTimeout(350);
        const trigger = toolbar.getByRole('button', {
          name: 'Search conversations',
          exact: true,
        });
        assert.equal(
          await trigger.evaluate((el) => document.activeElement === el),
          true,
          'Close restores keyboard focus',
        );
        await trigger.click();
        await input.waitFor();
        assert.equal(await input.inputValue(), '', 'Closing clears the query');
        await input.press('Escape');
        await page.waitForTimeout(350);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await trigger.click();
        const reduced = await toolbar.evaluate((el) => {
          const box = el.querySelector('.transition-\\[width\\]');
          return {
            property: getComputedStyle(box).transitionProperty,
            width: box.getBoundingClientRect().width,
            total: el.getBoundingClientRect().width,
          };
        });
        assert.equal(
          reduced.property,
          'none',
          'Reduced motion disables the CSS transition',
        );
        assert.ok(
          Math.abs(reduced.width - reduced.total) < 1,
          'Reduced motion opens immediately',
        );
        await input.press('Escape');
      }
      assert.deepEqual(errors, []);
      console.log(
        `PASS ${width}px ${dir}: profile, editor, truncation${width === 1440 ? ', search animation/focus' : ''}`,
      );
      await page.close();
    }
  }
} finally {
  await browser.close();
}
