/** Shared Deck chrome follows logical document scroll without changing geometry. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch();
try {
  for (const direction of ['ltr', 'rtl']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 680 } });
    await page.goto(`${process.env.STORYBOOK_URL ?? 'http://localhost:6007'}/iframe.html?id=blocks-app-shell--modular-deck&viewMode=story`);
    await page.getByTestId('modular-deck-navigation').waitFor();
    await page.evaluate((dir) => {
      document.documentElement.dir = dir;
      document.querySelectorAll('[dir]').forEach((node) => node.setAttribute('dir', dir));
    }, direction);
    await page.waitForTimeout(400);
    const samples = [];
    for (const offset of [0, 4, 32, 0]) {
      await page.evaluate((x) => scrollTo(x, 0), direction === 'rtl' ? -offset : offset);
      await page.waitForTimeout(100);
      samples.push(await page.getByTestId('modular-deck-navigation').evaluate((node) => ({
        opacity: Number(getComputedStyle(node, '::before').opacity),
        width: node.getBoundingClientRect().width,
        x: node.getBoundingClientRect().x,
      })));
    }
    assert.equal(samples[0].opacity, 0, `${direction} initial surface`);
    assert.ok(samples[1].opacity > 0 && samples[1].opacity < 1, `${direction} partial overlap`);
    assert.equal(samples[2].opacity, 1, `${direction} overlapping surface`);
    assert.equal(samples[3].opacity, 0, `${direction} reversible surface`);
    assert.ok(samples.every((sample) => sample.width === samples[0].width && sample.x === samples[0].x), `${direction} stable navigation geometry`);
    await page.close();
  }
  console.log('PASS Deck navigation surface: LTR/RTL logical scroll, reversible opacity, stable geometry');
} finally { await browser.close(); }
