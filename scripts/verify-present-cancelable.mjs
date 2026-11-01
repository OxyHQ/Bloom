/** Chromium focus and pointer checks for cancelable nested surfaces. */
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
      await page.goto(`${base}/iframe.html?id=base-surfaces--cancelable-surface&viewMode=story`);
      await page.getByRole('button', { name: 'Open owned surface' }).waitFor();
    };
    const invalidate = () =>
      page.evaluate(async () => {
        const hasOwned = () =>
          Array.from(document.querySelectorAll('[role="dialog"]')).some((element) =>
            element.textContent?.includes('Owned surface'),
          );
        const before = hasOwned();
        window.dispatchEvent(new Event('bloom-story-surface-invalidated'));
        const synchronous = hasOwned();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        return { before, synchronous, firstFrame: hasOwned() };
      });
    const owned = page.getByText('Owned surface', { exact: true });
    const other = page.getByText('Other surface', { exact: true });
    const parent = page.getByText('Parent surface', { exact: true });
    await go();
    const before = page.getByRole('button', { name: 'Abort surface before mount' });
    await before.click();
    await page.getByText('Owned: undefined').waitFor();
    assert.equal(await owned.count(), 0);
    assert.equal(await before.evaluate((node) => node === document.activeElement), true);

    await go();
    await page.getByRole('button', { name: 'Open parent surface' }).click();
    await parent.waitFor();
    const childOpener = page.getByRole('button', { name: 'Open cancelable child' });
    await childOpener.click();
    await owned.waitFor();
    const nestedTiming = await invalidate();
    assert.equal(nestedTiming.before, true);
    assert.equal(nestedTiming.firstFrame, false);
    await page.getByText('Owned: undefined').waitFor();
    await owned.waitFor({ state: 'hidden' });
    await parent.waitFor();
    await page.waitForFunction(() =>
      document.activeElement?.textContent?.includes('Open cancelable child'),
    );
    await page.getByRole('button', { name: 'Close parent' }).click({ timeout: 5000 });
    await parent.waitFor({ state: 'hidden' });

    await go();
    const normalOpener = page.getByRole('button', { name: 'Open owned surface' });
    await normalOpener.click();
    await owned.waitFor();
    await page.evaluate(() => {
      const hasOwned = () =>
        Array.from(document.querySelectorAll('[role="dialog"]')).some((element) =>
          element.textContent?.includes('Owned surface'),
        );
      window.addEventListener(
        'bloom-story-surface-answered',
        () => {
          window.__bloomNormalAnswer = { present: hasOwned(), closed: window.__bloomNormalClosed };
        },
        { once: true },
      );
      window.addEventListener(
        'bloom-story-surface-closed',
        () => {
          window.__bloomNormalClosed = { present: hasOwned() };
        },
        { once: true },
      );
    });
    await page.getByRole('button', { name: 'Finish owned surface' }).click();
    await page.waitForFunction(() => window.__bloomNormalClosed !== undefined);
    const normalAnswer = await page.evaluate(() => window.__bloomNormalAnswer);
    const normalClosed = await page.evaluate(() => window.__bloomNormalClosed);
    assert.equal(normalAnswer.present, true);
    assert.equal(normalAnswer.closed, undefined);
    assert.equal(normalClosed.present, false);
    await page.getByText('Owned: chosen').waitFor();
    await page.getByText('Closed: 1').waitFor();
    await normalOpener.click({ timeout: 5000 });
    await owned.waitFor();
    await invalidate();
    await owned.waitFor({ state: 'hidden' });

    await go();
    const exitOpener = page.getByRole('button', { name: 'Open owned surface' });
    await exitOpener.click();
    await owned.waitFor();
    const finishOwned = page.getByRole('button', { name: 'Finish owned surface' });
    await page.evaluate(() => {
      const hasOwned = () =>
        Array.from(document.querySelectorAll('[role="dialog"]')).some((element) =>
          element.textContent?.includes('Owned surface'),
        );
      let before = false;
      window.addEventListener(
        'bloom-story-exit-aborting',
        () => {
          before = hasOwned();
        },
        { once: true },
      );
      window.addEventListener(
        'bloom-story-exit-aborted',
        () => {
          const synchronous = hasOwned();
          requestAnimationFrame(() => {
            window.__bloomExitAbortTiming = { before, synchronous, firstFrame: hasOwned() };
          });
        },
        { once: true },
      );
      window.dispatchEvent(new Event('bloom-story-arm-exit-abort'));
    });
    await finishOwned.click();
    await page.waitForFunction(() => window.__bloomExitAbortTiming !== undefined);
    const exitTiming = await page.evaluate(() => window.__bloomExitAbortTiming);
    assert.equal(exitTiming.before, true);
    assert.equal(exitTiming.firstFrame, false);
    await page.getByText('Owned: chosen').waitFor();
    await owned.waitFor({ state: 'hidden' });
    await exitOpener.click({ timeout: 5000 });
    await owned.waitFor();
    await invalidate();
    await owned.waitFor({ state: 'hidden' });

    await go();
    await page.getByRole('button', { name: 'Open owned surface' }).click();
    await owned.waitFor();
    await page.getByRole('button', { name: 'Open other surface' }).click();
    await other.waitFor();
    const upper = page.getByRole('button', { name: 'Finish other' });
    await upper.focus();
    const lowerTiming = await invalidate();
    assert.equal(lowerTiming.before, true);
    assert.equal(lowerTiming.firstFrame, false);
    await page.getByText('Owned: undefined').waitFor();
    await owned.waitFor({ state: 'hidden' });
    assert.equal(await upper.evaluate((node) => node === document.activeElement), true);
    await upper.click({ timeout: 5000 });
    await page.getByText('Other: other').waitFor();
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        width,
        beforeMount: 'pass',
        nestedChild: 'pass',
        upperFocusAndPointer: 'pass',
        normalExitCallback: 'pass',
        abortAfterAnswer: 'pass',
        exitTiming,
        nestedTiming,
        lowerTiming,
      }),
    );
    await page.close();
  }
} finally {
  await browser.close();
}
