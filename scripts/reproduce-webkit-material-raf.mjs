/** Diagnostic: compare native frame delivery before/after a material-only fixture. */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
const { webkit } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6136';
const output = process.env.BLOOM_RAF_OUTPUT || '/tmp/bloom-webkit-material-raf';
mkdirSync(output, { recursive: true });
const report = [];
for (const [name, story, disableBackdrop] of [
  ['five-material-buttons', 'composition-headers-adaptive-actions--width-controls-only', false],
  [
    'same-buttons-backdrop-disabled-before-paint',
    'composition-headers-adaptive-actions--width-controls-only',
    true,
  ],
  ['existing-single-button', 'base-button--basic', false],
  ['existing-button-group', 'base-button-group--basic', false],
]) {
  const browser = await webkit.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((disable) => {
      const nativeRaf = requestAnimationFrame.bind(window);
      window.__materialFrames = 0;
      window.__materialTicks = 0;
      const tick = () => {
        window.__materialFrames++;
        nativeRaf(tick);
      };
      nativeRaf(tick);
      setInterval(() => window.__materialTicks++, 100);
      if (disable) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(
          '*,*::before,*::after {backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
        );
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      }
    }, disableBackdrop);
    await page.goto(`${base}/iframe.html?id=${story}&viewMode=story`);
    await page.waitForSelector('button', { state: 'attached', timeout: 120000 });
    await page.waitForTimeout(1500);
    const before = await page.evaluate(() => ({
      frames: window.__materialFrames,
      ticks: window.__materialTicks,
    }));
    await page.waitForTimeout(1200);
    const after = await page.evaluate(() => ({
      frames: window.__materialFrames,
      ticks: window.__materialTicks,
      visibility: document.visibilityState,
    }));
    await page.screenshot({ path: join(output, `${name}.png`) });
    report.push({
      name,
      story,
      disableBackdrop,
      before,
      after,
      frameDelta: after.frames - before.frames,
      errors,
    });
  } finally {
    await browser.close();
  }
}
writeFileSync(join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
