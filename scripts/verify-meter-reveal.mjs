import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ratio = async (page) => page.getByTestId('revealed-rating-fill').evaluate((fill) => fill.getBoundingClientRect().width / fill.parentElement.getBoundingClientRect().width);
try {
  for (const mode of ['document', 'clipped']) {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await page.goto(`${base}/iframe.html?id=layout-viewport--${mode}-reveal&viewMode=story`);
    const meter = page.getByRole('progressbar', { name: 'Five stars' });
    await expect(meter).toHaveAttribute('aria-valuenow', '75', { timeout: 120000 });
    await expect(page.getByTestId('histogram-visible')).toHaveText('false');
    expect(await ratio(page)).toBe(0);
    if (mode === 'clipped') {
      await page.getByTestId('reveal-scroll').evaluate((node) => { node.scrollTop = 340; });
      // Only 40 of the target's 80px are visible; threshold 1 must not trigger.
      await expect(page.getByTestId('histogram-visible')).toHaveText('false');
      expect(await ratio(page)).toBe(0);
      await page.getByTestId('reveal-scroll').evaluate((node) => { node.scrollTop = 420; });
    } else await page.getByTestId('observed-histogram').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('histogram-visible')).toHaveText('true');
    await expect(meter).toHaveAttribute('aria-valuenow', '75');
    const samples = await page.getByTestId('revealed-rating-fill').evaluate((fill) => new Promise((resolve) => {
      const start = performance.now(); const frames = [];
      const read = () => {
        const ms = performance.now() - start;
        frames.push({ ms, ratio: fill.getBoundingClientRect().width / fill.parentElement.getBoundingClientRect().width });
        if (ms < 1500) requestAnimationFrame(read); else resolve(frames);
      }; read();
    }));
    expect(samples.some((frame) => frame.ms < 150 && frame.ratio === 0)).toBe(true);
    expect(samples.some((frame) => frame.ratio > .05 && frame.ratio < .7)).toBe(true);
    expect(samples.at(-1).ratio).toBeCloseTo(.75, 2);
    const css = await page.getByTestId('revealed-rating-fill').evaluate((fill) => {
      const style = getComputedStyle(fill); return [style.transitionDuration, style.transitionDelay, style.transitionTimingFunction];
    });
    expect(css).toEqual(['1s', '0.3s', 'cubic-bezier(0.4, 0, 0.2, 1)']);
    if (mode === 'clipped') await page.getByTestId('reveal-scroll').evaluate((node) => { node.scrollTop = 0; });
    else await page.evaluate(() => window.scrollTo(0, 0));
    expect(await ratio(page)).toBeCloseTo(.75, 2);
    console.log({ mode, realValueDuringDelay: true, partialThreshold: true, animatedFrames: true, once: true });
    await page.close();
  }
  for (const reducedInitially of [true, false]) {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 }, reducedMotion: reducedInitially ? 'reduce' : 'no-preference' });
    await page.goto(`${base}/iframe.html?id=layout-viewport--document-reveal&viewMode=story`);
    await expect(page.getByRole('progressbar', { name: 'Five stars' })).toHaveAttribute('aria-valuenow', '75', { timeout: 120000 });
    if (!reducedInitially) {
      await page.getByTestId('observed-histogram').scrollIntoViewIfNeeded();
      await expect(page.getByTestId('histogram-visible')).toHaveText('true');
      await page.emulateMedia({ reducedMotion: 'reduce' });
    }
    await expect.poll(() => ratio(page)).toBeCloseTo(.75, 2);
    const transition = await page.getByTestId('revealed-rating-fill').evaluate((node) => getComputedStyle(node).transitionDuration);
    expect(transition).toBe('0s');
    console.log({ reducedInitially, settlesImmediately: true });
    await page.close();
  }
} finally { await browser.close(); }
