/** Real Dialog cancellation and panel exit completion, without consumer timers. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
try {
  for (const mobile of [false, true]) {
    const page = await browser.newPage({ viewport: { width: mobile ? 390 : 1440, height: 900 } });
    await page.goto(
      `${process.env.STORYBOOK_URL ?? 'http://localhost:6014'}/iframe.html?id=blocks-panel-groups--nested-split&viewMode=story`,
    );
    const open = page.getByTestId('groups-open');
    await open.click();
    await page.getByTestId('groups-close').waitFor();
    if (mobile) await page.getByRole('dialog', { name: 'Likes' }).waitFor();
    await page.waitForFunction(() => {
      const track = document.querySelector('[data-testid="groups-likes"]');
      return !track
        ?.getAnimations({ subtree: true })
        .some((animation) => animation.playState === 'running');
    });
    // A host may reopen during an outgoing animation; trigger both controlled
    // intents directly because a modal intentionally makes its opener inert.
    await page.getByTestId('groups-close').evaluate((node) => node.click());
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await open.evaluate((node) => node.click());
    await page.waitForTimeout(800);
    assert.match(await open.getAttribute('aria-label'), /completed exits 0$/);
    if (mobile) await page.getByRole('dialog', { name: 'Likes' }).waitFor();
    await page.getByTestId('groups-close').click();
    await page.waitForFunction(() =>
      document
        .querySelector('[data-testid="groups-open"]')
        ?.getAttribute('aria-label')
        ?.endsWith('completed exits 1'),
    );
    if (mobile) await page.getByRole('dialog', { name: 'Likes' }).waitFor({ state: 'hidden' });
    await open.click();
    await page.getByTestId('groups-close').click();
    await page.waitForFunction(() =>
      document
        .querySelector('[data-testid="groups-open"]')
        ?.getAttribute('aria-label')
        ?.endsWith('completed exits 2'),
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open.click();
    await page.getByTestId('groups-close').click();
    await page.waitForFunction(() =>
      document
        .querySelector('[data-testid="groups-open"]')
        ?.getAttribute('aria-label')
        ?.endsWith('completed exits 3'),
    );
    console.log(
      `PASS ${mobile ? 'mobile actual Dialog' : 'desktop CSS'}: completion once, reopen cancellation, next exit, reduced motion`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
