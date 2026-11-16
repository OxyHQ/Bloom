/** Header/media compositions: real pointer input, shared bottom search, and responsive geometry. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_PATH ?? 'puppeteer-core');
const output = '.local/header-media-check';
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
      await page.setViewport({ width: 390, height: 844, hasTouch: touch });
      const visit = async (story) => {
        await page.goto(
          `${base}/iframe.html?id=blocks-page-header-media--${story}&viewMode=story&globals=theme:${theme}`,
          { waitUntil: 'domcontentloaded' },
        );
        await page.waitForSelector('[data-testid="media-navigation"]');
      };
      for (const [story, label, query, positive, negative] of [
        ['photo-library', 'Search photos', 'forest', 'Forest light', 'Along the coast'],
        ['music-collection', 'Search music', 'coast', 'Coastline', 'Slow morning'],
      ]) {
        await visit(story);
        await page.waitForSelector(`button[aria-label="${label}"]`);
        await page.evaluate((name) => {
          window.mediaSearchInput = document.querySelector(`input[aria-label="${name}"]`);
        }, label);
        await page.click(`button[aria-label="${label}"]`);
        await page.waitForFunction(
          (name) =>
            document.querySelector(`input[aria-label="${name}"]`).getBoundingClientRect().width >
            250,
          {},
          label,
        );
        await page.click(`input[aria-label="${label}"]`);
        await page.type(`input[aria-label="${label}"]`, query);
        await page.waitForFunction(
          (text, photos) => {
            const content = photos
              ? [...document.querySelectorAll('[data-testid^="photo-"][aria-label]')]
                  .map((node) => node.getAttribute('aria-label'))
                  .join(' ')
              : document.body.innerText;
            return !content.includes(text);
          },
          {},
          negative,
          story === 'photo-library',
        );
        assert(
          await page.evaluate(
            (text, photos) => {
              const content = photos
                ? [...document.querySelectorAll('[data-testid^="photo-"][aria-label]')]
                    .map((node) => node.getAttribute('aria-label'))
                    .join(' ')
                : document.body.innerText;
              return content.includes(text);
            },
            positive,
            story === 'photo-library',
          ),
        );
        await page.screenshot({ path: `${output}/${story}-mobile-${theme}-${touch}.png` });
        await page.setViewport({ width: 1100, height: 844, hasTouch: touch });
        await page.waitForFunction(
          () => window.mediaSearchInput.getBoundingClientRect().width > 400,
        );
        assert(await page.evaluate(() => document.activeElement === window.mediaSearchInput));
        assert.equal(await page.evaluate(() => window.mediaSearchInput.value), query);
        await page.screenshot({ path: `${output}/${story}-wide-${theme}-${touch}.png` });
        await page.click('[data-testid="searchTextInputClearBtn"]');
        await page.waitForFunction(
          (text, photos) => {
            const content = photos
              ? [...document.querySelectorAll('[data-testid^="photo-"][aria-label]')]
                  .map((node) => node.getAttribute('aria-label'))
                  .join(' ')
              : document.body.innerText;
            return content.includes(text);
          },
          {},
          negative,
          story === 'photo-library',
        );
        if (story === 'photo-library') {
          await page.type(`input[aria-label="${label}"]`, 'no-matching-photo');
          await page.waitForSelector('[data-testid="photo-empty"]', { visible: true });
          const empty = await page.evaluate(() => {
            const message = document
              .querySelector('[data-testid="photo-empty"]')
              .getBoundingClientRect();
            const header = document
              .querySelector('[data-testid="library-header"]')
              .getBoundingClientRect();
            return { messageTop: message.top, headerBottom: header.bottom };
          });
          assert(
            empty.messageTop >= empty.headerBottom - 1,
            'Empty state must remain below the header',
          );
          await page.click('[data-testid="searchTextInputClearBtn"]');
          await page.waitForSelector('[data-testid="photo-forest"]');
          assert(await page.evaluate(() => !document.querySelector('[data-testid="photo-empty"]')));
        }
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => {
          const box = document
            .querySelector('[data-testid="search-capsule"]')
            .getBoundingClientRect();
          return box.width <= box.height + 1;
        });
        assert(
          await page.evaluate(
            (name) =>
              document.querySelector(`input[aria-label="${name}"]`) === window.mediaSearchInput,
            label,
          ),
        );
        await page.setViewport({ width: 360, height: 844, hasTouch: touch });
        // The shared bar animates from the wide lane to its compact position.
        // Hit-test the settled trigger, not a coordinate it has already left.
        await page.evaluate(async (name) => {
          const trigger = document.querySelector(`button[aria-label="${name}"]`);
          let previous = '';
          let stable = 0;
          for (let frame = 0; frame < 120; frame += 1) {
            await new Promise(requestAnimationFrame);
            const box = trigger.getBoundingClientRect();
            const current = [box.x, box.y, box.width, box.height].map(Math.round).join(',');
            stable = current === previous ? stable + 1 : 0;
            if (stable >= 6 && box.width > 0 && box.right <= innerWidth) return;
            previous = current;
          }
          throw new Error('Search trigger did not settle after resizing');
        }, label);
        await page.click(`button[aria-label="${label}"]`);
        await page.waitForFunction(
          () => window.mediaSearchInput.getBoundingClientRect().width > 220,
        );
        await page.keyboard.press('Escape');
        console.log(
          `${story}: ${theme}/${touch ? 'touch' : 'pointer'} search, focus, pointer clear, resize, reopen passed`,
        );
      }
      await page.close();
      assert.deepEqual(errors, []);
    }
} finally {
  await browser.close();
}
