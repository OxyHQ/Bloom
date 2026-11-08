import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_PATH || 'puppeteer-core');
const out = process.env.OUT || '.local/issue-663-material/optics-web-fixed';
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2.625 });
  const report = { browser: await browser.version(), cases: [] };
  for (const [variant, theme] of [
    ['taper', 'light'],
    ['narrow-taper', 'light'],
    ['corner-taper', 'light'],
    ['corner-taper', 'dark'],
    ['narrow-taper', 'dark'],
    ['taper', 'dark'],
  ]) {
    await page.goto(
      `${process.env.STORYBOOK_URL || 'http://localhost:6035'}/iframe.html?id=labs-loader-optics--${variant}&viewMode=story&globals=theme:${theme};material:standard`,
    );
    await page.waitForSelector('[data-testid="optics-loader"] svg rect');
    await new Promise((resolve) => setTimeout(resolve, 800));
    const geometry = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="optics-loader"]');
      const rect = root.getBoundingClientRect();
      const svg = root.querySelector('svg');
      const shape = svg.querySelector('rect');
      const radius = Number(shape.getAttribute('rx'));
      const perimeter = 2 * (rect.width + rect.height) - 8 * radius + 2 * Math.PI * radius;
      // Android CW rounded rect starts at the left/bottom arc join. DOM rect
      // starts at the top/left arc join. Align physical phase, not equal time.
      const nativeOrigin = -(rect.height - 2 * radius) - (Math.PI * radius) / 2;
      const phaseSeconds = 1 + (4.5 * nativeOrigin) / perimeter;
      const animations = root.getAnimations({ subtree: true });
      for (const animation of animations) {
        animation.pause();
        animation.currentTime = phaseSeconds * 1000;
      }
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        radius,
        perimeter,
        nativeOrigin,
        phaseSeconds,
        animations: animations.length,
        svg: svg.outerHTML,
      };
    });
    assert(geometry.animations === (variant === 'plain' ? 3 : 42));
    for (const layer of ['all', 'bloom', 'glow', 'line', 'none']) {
      await page.evaluate((layer) => {
        const roots = [...document.querySelectorAll('[data-testid="optics-loader"] svg rect')];
        const index = ['bloom', 'glow', 'line'].indexOf(layer);
        roots.forEach((rect, i) => {
          rect.style.visibility =
            layer === 'all' || Math.floor(i / 14) === index ? 'visible' : 'hidden';
        });
      }, layer);
      await page.screenshot({ path: `${out}/${theme}-${variant}-${layer}.png` });
    }
    report.cases.push({ variant, theme, ...geometry });
  }
  writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
