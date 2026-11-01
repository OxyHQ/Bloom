/** Real Chromium focus, pointer and stack checks against the Storybook web fork. */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BLOOM_PLAYWRIGHT_MODULE ?? '@playwright/test');
const base = process.env.STORYBOOK_URL ?? 'http://127.0.0.1:6006';
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [390, 1000]) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const go = async () => {
      await page.goto(`${base}/iframe.html?id=base-surfaces--abortable-confirm&viewMode=story`);
      await page.getByRole('button', { name: 'Open session confirmation' }).waitFor();
    };
    const invalidate = () =>
      page.evaluate(() => window.dispatchEvent(new Event('bloom-story-session-invalidated')));
    await go();
    const before = page.getByRole('button', { name: 'Abort before mount' });
    await before.click();
    await page.getByText('Owned: false').waitFor();
    assert.equal(await page.getByText('Session confirmation', { exact: true }).count(), 0);
    assert.equal(await before.evaluate((node) => node === document.activeElement), true);

    await go();
    const normalOpener = page.getByRole('button', { name: 'Open session confirmation' });
    await normalOpener.click();
    await page.getByText('Session confirmation', { exact: true }).waitFor();
    await page.evaluate(() => {
      const hasOwned = () =>
        Array.from(document.querySelectorAll('[role="dialog"]')).some((element) =>
          element.textContent?.includes('Session confirmation'),
        );
      window.addEventListener(
        'bloom-story-confirm-answered',
        () => {
          window.__bloomConfirmAnswer = {
            present: hasOwned(),
            closed: window.__bloomConfirmClosed,
          };
        },
        { once: true },
      );
      window.addEventListener(
        'bloom-story-confirm-closed',
        () => {
          window.__bloomConfirmClosed = { present: hasOwned() };
        },
        { once: true },
      );
    });
    await page.getByRole('button', { name: 'Confirm session' }).click();
    await page.waitForFunction(() => window.__bloomConfirmClosed !== undefined);
    const normalAnswer = await page.evaluate(() => window.__bloomConfirmAnswer);
    const normalClosed = await page.evaluate(() => window.__bloomConfirmClosed);
    assert.equal(normalAnswer.present, true);
    assert.equal(normalAnswer.closed, undefined);
    assert.equal(normalClosed.present, false);
    await page.getByText('Owned: true').waitFor();

    await go();
    await page.getByRole('button', { name: 'Open session confirmation' }).click();
    await page.getByText('Session confirmation', { exact: true }).waitFor();
    await page.evaluate(() => {
      const hasOwned = () =>
        Array.from(document.querySelectorAll('[role="dialog"]')).some((element) =>
          element.textContent?.includes('Session confirmation'),
        );
      let before = false;
      window.addEventListener(
        'bloom-story-confirm-exit-aborting',
        () => {
          before = hasOwned();
        },
        { once: true },
      );
      window.addEventListener(
        'bloom-story-confirm-exit-aborted',
        () => {
          const synchronous = hasOwned();
          requestAnimationFrame(() => {
            window.__bloomConfirmExitTiming = { before, synchronous, firstFrame: hasOwned() };
          });
        },
        { once: true },
      );
      window.dispatchEvent(new Event('bloom-story-arm-confirm-exit-abort'));
    });
    await page.getByRole('button', { name: 'Confirm session' }).click();
    await page.waitForFunction(() => window.__bloomConfirmExitTiming !== undefined);
    const exitTiming = await page.evaluate(() => window.__bloomConfirmExitTiming);
    assert.equal(exitTiming.before, true);
    assert.equal(exitTiming.firstFrame, false);
    await page.getByText('Owned: true').waitFor();

    await go();
    const opener = page.getByRole('button', { name: 'Open session confirmation' });
    await opener.click();
    await page.getByText('Session confirmation', { exact: true }).waitFor();
    await invalidate();
    await page.getByText('Owned: false').waitFor();
    await page.getByText('Session confirmation', { exact: true }).waitFor({ state: 'hidden' });
    await opener.waitFor({ state: 'visible' });
    await page.waitForFunction(() =>
      document.activeElement?.textContent?.includes('Open session confirmation'),
    );
    // A real pointer click proves the closed modal no longer blocks the screen.
    await opener.click({ timeout: 5000 });
    await page.getByText('Session confirmation', { exact: true }).waitFor();
    await invalidate();
    await page.getByText('Session confirmation', { exact: true }).waitFor({ state: 'hidden' });

    await go();
    await page.getByRole('button', { name: 'Open stacked confirmations' }).click();
    await page.getByText('Session confirmation', { exact: true }).waitFor();
    await page.getByText('Other confirmation', { exact: true }).waitFor();
    const upper = page.getByRole('button', { name: 'Confirm other' });
    await upper.focus();
    await invalidate();
    await page.getByText('Owned: false').waitFor();
    await page.getByText('Session confirmation', { exact: true }).waitFor({ state: 'hidden' });
    assert.equal(await upper.evaluate((node) => node === document.activeElement), true);
    await upper.click({ timeout: 5000 });
    await page.getByText('Other: true').waitFor();
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        width,
        beforeMount: 'pass',
        normalExitCallback: 'pass',
        abortAfterAnswer: 'pass',
        exitTiming,
        focusAndPointer: 'pass',
        stackedFocusAndPointer: 'pass',
      }),
    );
    await page.close();
  }
} finally {
  await browser.close();
}
