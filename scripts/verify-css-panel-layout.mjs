/** Container geometry must continue responding after application JavaScript is paused. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6007';
try {
  await page.goto(`${base}/iframe.html?id=blocks-app-shell--modular-expanding-feed&viewMode=story`);
  await page.getByTestId('modular-feed-panels-context').waitFor();
  await page.waitForTimeout(400);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
  for (const width of [989, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    const geometry = await page.evaluate(() => {
      const main = document.querySelector('[data-testid="modular-feed-panels-main"]');
      const context = document.querySelector('[data-testid="modular-feed-panels-context"]');
      const border = main.querySelector('[data-bloom-panel-border]');
      return { main: main.getBoundingClientRect().width, context: context.getBoundingClientRect().width,
        border: border ? getComputedStyle(border).display : 'absent', overflow: document.documentElement.scrollWidth > innerWidth };
    });
    assert.equal(geometry.main, width < 768 ? width : 620);
    assert.equal(geometry.context, width < 990 ? 0 : 350);
    assert.equal(geometry.border === 'none', width < 768);
    assert.equal(geometry.overflow, false);
  }
  await cdp.send('Emulation.setScriptExecutionDisabled', { value: false });
  console.log('PASS CSS container layout: geometry and framing adapt with application JavaScript paused');
} finally {
  await browser.close();
}
