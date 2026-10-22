/** Catch one-frame stale bottom-edge claims while responsive chrome disappears. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 393, height: 900 },
  reducedMotion: 'no-preference',
});
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6007';
try {
  await page.goto(`${base}/iframe.html?id=blocks-app-shell--bounded-chrome&viewMode=story`);
  await page.getByTestId('bounded-chrome-panels-detail').waitFor();
  await page.waitForTimeout(300);
  for (const width of [1440, 393, 1280, 393]) {
    await page.evaluate(() => {
      window.chromeFrames = [];
      window.chromeSampling = true;
      const sample = () => {
        const group = document.querySelector('[data-bloom-panel-group]');
        const bar = document.querySelector('[data-testid="bounded-chrome-bottom-bar"]');
        const detail = document.querySelector('[data-testid="bounded-chrome-panels-detail"]');
        const rect = detail.getBoundingClientRect();
        const barRect = bar.getBoundingClientRect();
        window.chromeFrames.push({
          width: innerWidth,
          inset: parseFloat(getComputedStyle(group).paddingBottom),
          panelBottom: rect.bottom,
          panelHeight: rect.height,
          barTop: barRect.top,
          barHeight: barRect.height,
        });
        if (window.chromeSampling) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(400);
    const frames = await page.evaluate(() => {
      window.chromeSampling = false;
      return window.chromeFrames;
    });
    const resized = frames.filter((frame) => frame.width === width);
    assert.ok(resized.length > 5, 'Expected real animation-frame samples after resizing');
    for (const frame of resized) {
      assert.equal(frame.inset, 0, `Stale consumed bar claim: ${JSON.stringify(frame)}`);
      assert.ok(frame.panelHeight > 0, 'The active panel must remain visible');
      if (frame.barHeight > 0)
        assert.ok(frame.panelBottom <= frame.barTop + 1, 'Panel overlaps chrome');
    }
  }
  console.log('PASS bounded chrome: no stale edge reserve or overlap in resize animation frames');
} finally {
  await browser.close();
}
