import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const require = createRequire(
  join(resolve(process.env.PLAYWRIGHT_PACKAGE_ROOT ?? '.'), 'package.json'),
);
const { chromium } = require('playwright');
const origin = process.env.BLOOM_STORYBOOK_ORIGIN ?? 'http://localhost:6017';
const output = resolve(process.env.REPORT_DIR ?? '.local/detail-dialog');
mkdirSync(output, { recursive: true });
const source = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of [1440, 390]) {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      for (const mode of ['side', 'center']) {
        const context = await browser.newContext({
          viewport: { width, height: width === 1440 ? 1000 : 700 },
          reducedMotion,
        });
        try {
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', (error) => errors.push(error.message));
          await page.goto(
            `${origin}/iframe.html?id=surfaces-detail-dialog--record&viewMode=story&globals=theme:dark;colorPreset:umber-signal`,
          );
          if (mode === 'center') await page.getByTestId('detail-mode').click();
          await page.getByTestId('detail-open').click();
          // Visual bands are deliberately inert DOM copies during the 480ms motion.
          const live = page
            .locator('.bloom-detail-dialog-genie > .bloom-detail-dialog-surface')
            .first();
          const field = live.getByTestId('detail-draft');
          await field.click();
          await field.fill('Retained product draft');
          await page.waitForFunction(
            () => document.querySelectorAll('.bloom-detail-dialog-band').length === 0,
          );
          const surface = await live.getByTestId('record-detail-surface').boundingBox();
          const scroll = live.getByTestId('record-detail-scroll');
          const metrics = await scroll.evaluate((node) => ({
            height: node.clientHeight,
            total: node.scrollHeight,
            top: node.scrollTop,
          }));
          assert.ok(surface && surface.height > 500, 'detail surface must own a real viewport');
          assert.ok(
            metrics.height > 400 && metrics.total > metrics.height,
            'one bounded long body must scroll',
          );
          const headerBefore = await live.getByTestId('record-detail-header').boundingBox();
          const footerBefore = await live.getByTestId('detail-save').boundingBox();
          assert.ok(
            (await field.boundingBox()).y >= headerBefore.y + headerBefore.height - 1,
            'first field must clear the header',
          );
          await scroll.hover();
          await page.mouse.wheel(0, 700);
          await page.waitForFunction(
            () => document.querySelector('[data-testid="record-detail-scroll"]').scrollTop > 0,
          );
          const headerAfter = await live.getByTestId('record-detail-header').boundingBox();
          const footerAfter = await live.getByTestId('detail-save').boundingBox();
          assert.equal(headerAfter.y, headerBefore.y, 'header remains fixed while body scrolls');
          assert.equal(footerAfter.y, footerBefore.y, 'footer remains fixed while body scrolls');
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
            false,
          );
          assert.deepEqual(errors, []);
          await page.screenshot({ path: join(output, `${width}-${mode}-${reducedMotion}.png`) });
          await page.keyboard.press('Escape');
          await page.waitForFunction(
            () => document.querySelectorAll('[role="dialog"]').length === 0,
          );
          assert.equal(
            await page.locator('.bloom-detail-dialog-band').count(),
            0,
            'no exit snapshot survives closure',
          );
          await page.getByTestId('detail-open').click();
          await field.click();
          assert.equal(await field.inputValue(), 'Retained product draft');
          await live.getByTestId('detail-save').click();
          await page.waitForFunction(
            () => document.querySelectorAll('[role="dialog"]').length === 0,
          );
          results.push({
            width,
            reducedMotion,
            mode,
            surface,
            metrics,
            headerBefore,
            footerBefore,
            passed: true,
          });
        } finally {
          await context.close();
        }
      }
    }
  }
  writeFileSync(
    join(output, 'results.json'),
    JSON.stringify({ source, browser: browser.version(), results }, null, 2),
  );
  console.log(
    `DetailDialog: ${results.length} actual pointer/scroll/close/reopen scenarios passed (${source}).`,
  );
} finally {
  await browser.close();
}
