/** Real browser geometry, material and focus checks. Run against Storybook :6006. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_PATH ?? 'puppeteer-core');
const output = '.local/button-search-check';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
try {
  for (const touch of [false, true])
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewport({ width: 1000, height: 650, hasTouch: touch });
      await page.goto(
        `${base}/iframe.html?id=blocks-page-header--floating&viewMode=story&globals=theme:${theme};material:contrast`,
        { waitUntil: 'domcontentloaded' },
      );
      await page.waitForSelector('[data-testid="header-back"]');
      const controls = await page.evaluate(() =>
        ['Back', 'Share', 'More'].map((label) => {
          const node = document.querySelector(`button[aria-label="${label}"]`);
          const rect = node.getBoundingClientRect();
          return {
            label,
            width: rect.width,
            height: rect.height,
            glyph: node.querySelector('svg').getBoundingClientRect().width,
            paintHeight: Number.parseFloat(getComputedStyle(node, '::before').height),
            paintWidth: Number.parseFloat(getComputedStyle(node, '::before').width),
            edge: getComputedStyle(node, '::after').borderTopColor,
            edgeWidth: getComputedStyle(node, '::after').borderTopWidth,
          };
        }),
      );
      for (const item of controls) {
        assert.equal(item.width, touch ? 44 : 36);
        assert.equal(item.height, touch ? 44 : 36);
        assert.equal(item.glyph, 20);
        if (touch || item.label === 'Back') {
          assert.equal(item.paintHeight, 36);
          assert.equal(item.paintWidth, 36);
        }
      }
      for (const item of [controls[0]]) {
        assert.equal(item.edgeWidth, '1px');
        assert.notEqual(item.edge, 'rgba(0, 0, 0, 0)');
      }
      await page.screenshot({ path: `${output}/buttons-${theme}-${touch}.png` });
      await page.goto(
        `${base}/iframe.html?id=blocks-page-header--adaptive-search&viewMode=story&globals=theme:${theme}`,
        { waitUntil: 'domcontentloaded' },
      );
      await page.waitForSelector('input[aria-label="Search notes"]', { visible: true });
      await page.waitForFunction(
        () =>
          Math.abs(
            document.querySelector('[data-testid="search-capsule"]').getBoundingClientRect().width -
              360,
          ) < 1,
      );
      await page.evaluate(() => {
        window.searchInput = document.querySelector('input[aria-label="Search notes"]');
      });
      const fieldPaint = await page.$eval('[data-testid="text-field-paint"]', (node) => ({
        height: node.getBoundingClientRect().height,
        edge: getComputedStyle(node, '::after').borderTopWidth,
      }));
      assert.equal(fieldPaint.height, 36, 'expanded Search chrome retains normal visual height');
      await page.screenshot({ path: `${output}/search-wide-${theme}-${touch}.png` });
      await page.setViewport({ width: 320, height: 650, hasTouch: touch });
      await page.waitForSelector('button[aria-label="Search notes"]', { visible: true });
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="search-capsule"]').getBoundingClientRect().width <=
          44,
      );
      await page.waitForFunction(
        () => document.querySelector('[data-testid="search-capsule"]').getAnimations().length === 0,
      );
      const glyphOffset = await page.evaluate(() => {
        const button = document.querySelector('button[aria-label="Search notes"]');
        const box = button.getBoundingClientRect();
        const glyph = button.querySelector('svg').getBoundingClientRect();
        return {
          x: Math.abs(glyph.left + glyph.width / 2 - box.left - box.width / 2),
          y: Math.abs(glyph.top + glyph.height / 2 - box.top - box.height / 2),
        };
      });
      assert(glyphOffset.x < 1 && glyphOffset.y < 1, 'Collapsed search glyph must be centered');
      const frames = await page.evaluate(async () => {
        const capsule = document.querySelector('[data-testid="search-capsule"]');
        const widths = [capsule.getBoundingClientRect().width];
        document.querySelector('button[aria-label="Search notes"]').click();
        const start = performance.now();
        await new Promise((resolve) => {
          function sample() {
            widths.push(capsule.getBoundingClientRect().width);
            if (performance.now() - start < 600) requestAnimationFrame(sample);
            else resolve();
          }
          requestAnimationFrame(sample);
        });
        return widths;
      });
      const first = frames[0],
        last = frames.at(-1);
      assert(last > first + 40);
      assert(
        frames.some((width) => width > first + 4 && width < last - 4),
        'Opening must include intermediate widths',
      );
      await page.waitForFunction(() => document.activeElement === window.searchInput);
      await page.keyboard.down('Shift');
      await page.keyboard.press('Tab');
      await page.keyboard.up('Shift');
      await new Promise((resolve) => setTimeout(resolve, 250));
      assert.equal(
        await page.evaluate(() => document.activeElement.getAttribute('aria-label')),
        'Close',
      );
      assert(await page.evaluate(() => document.activeElement.getBoundingClientRect().height > 0));
      await page.keyboard.press('Tab');
      await page.keyboard.type('Nature');
      await page.waitForFunction(
        () =>
          document.body.innerText.includes('Nature Walks') &&
          !document.body.innerText.includes('A day on the coast'),
      );
      await page.setViewport({ width: 375, height: 650, hasTouch: touch });
      assert(
        await page.evaluate(
          () =>
            window.searchInput === document.activeElement && window.searchInput.value === 'Nature',
        ),
      );
      await page.click('[data-testid="searchTextInputClearBtn"]');
      await page.waitForFunction(
        () => window.searchInput.value === '' && document.activeElement === window.searchInput,
      );
      await page.waitForFunction(() => document.body.innerText.includes('A day on the coast'));
      await page.keyboard.type('Nature');
      await page.screenshot({ path: `${output}/search-compact-${theme}-${touch}.png` });
      await page.evaluate(() => {
        window.escaped = 0;
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') window.escaped++;
        });
      });
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(() => window.escaped), 0);
      await page.waitForFunction(
        () =>
          document.activeElement.getAttribute('aria-label') === 'Search notes' &&
          document.activeElement.tagName === 'BUTTON',
      );
      // Focus returns at the start of collapse; wait for the moving trigger's
      // hit box before issuing a real pointer click at its final position.
      assert(
        await page.evaluate(async () => {
          const button = document.querySelector('button[aria-label="Search notes"]');
          let previous = '',
            stableFrames = 0;
          const deadline = performance.now() + 3000;
          while (performance.now() < deadline) {
            await new Promise(requestAnimationFrame);
            const rect = button.getBoundingClientRect();
            const position = [rect.x, rect.y, rect.width, rect.height]
              .map((n) => n.toFixed(2))
              .join(',');
            stableFrames = position === previous ? stableFrames + 1 : 0;
            previous = position;
            if (stableFrames >= 8) return rect.width > 0;
          }
          return false;
        }),
        'Collapsed search trigger settles before pointer hit testing',
      );
      await page.click('button[aria-label="Search notes"]');
      await page.waitForFunction(() => document.activeElement === window.searchInput);
      assert.equal(
        await page.$eval('input[aria-label="Search notes"]', (node) => node.value),
        'Nature',
      );
      await page.waitForFunction(
        () => document.querySelector('[data-testid="search-capsule"]').getAnimations().length === 0,
      );
      // Reverse before the collapse lands: no reset to either endpoint, same input.
      const reversal = await page.evaluate(async () => {
        const capsule = document.querySelector('[data-testid="search-capsule"]');
        const widths = [capsule.getBoundingClientRect().width];
        document.querySelector('button[aria-label="Close"]').click();
        const start = performance.now();
        setTimeout(() => document.querySelector('button[aria-label="Search notes"]').click(), 100);
        await new Promise((resolve) => {
          function sample() {
            widths.push(capsule.getBoundingClientRect().width);
            if (performance.now() - start < 650) requestAnimationFrame(sample);
            else resolve();
          }
          requestAnimationFrame(sample);
        });
        return {
          widths,
          retained:
            document.querySelector('input[aria-label="Search notes"]') === window.searchInput,
        };
      });
      assert(reversal.retained);
      assert(Math.min(...reversal.widths) < reversal.widths[0] - 10);
      assert(Math.abs(reversal.widths.at(-1) - reversal.widths[0]) < 2);
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.waitForFunction(
        () =>
          getComputedStyle(document.querySelector('[data-testid="search-capsule"]'))
            .transitionDuration === '0s',
      );
      await page.keyboard.press('Escape');
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="search-capsule"]').getBoundingClientRect().width <=
          44,
      );
      assert.equal(await page.$$eval('button input, button button', (nodes) => nodes.length), 0);
      assert.deepEqual(errors, []);
      console.log(
        `PASS ${theme}, ${touch ? 'touch emulation' : 'pointer'}: shared geometry/rim, width adaptation, intermediate motion/reversal, reduced motion, stable input, Tab and Escape`,
      );
      await page.close();
    }
} finally {
  await browser.close();
}
