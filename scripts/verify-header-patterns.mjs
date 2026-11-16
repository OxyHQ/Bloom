/** Integrated header interactions against the live Storybook, including real pointer hit testing. */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_PATH ?? 'puppeteer-core');
const output = '.local/header-pattern-check';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox'],
});
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6006';

async function clickText(page, text) {
  const handle = await page.evaluateHandle(
    (label) =>
      [...document.querySelectorAll('button, [role="button"], [role="tab"]')].find(
        (node) =>
          (node.getAttribute('aria-label') ?? node.textContent).trim() === label &&
          node.getBoundingClientRect().width > 0 &&
          !node.closest('[inert]'),
      ),
    text,
  );
  assert(handle.asElement(), `Missing visible control: ${text}`);
  await handle.asElement().click();
  await handle.dispose();
}

try {
  for (const width of [360, 1100]) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewport({ width, height: 844, hasTouch: width === 360 });
      const open = async (story) => {
        await page.goto(
          `${base}/iframe.html?id=blocks-page-header-patterns--${story}&viewMode=story&globals=theme:${theme}`,
          { waitUntil: 'domcontentloaded' },
        );
      };

      await page.goto(
        `${base}/iframe.html?id=blocks-page-header--floating&viewMode=story&globals=theme:${theme}`,
        { waitUntil: 'domcontentloaded' },
      );
      await page.waitForSelector('[data-testid="header-bar"]');
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="header-bar"]').getBoundingClientRect().height ===
          60,
      );
      const ordinary = await page.$eval('[data-testid="header-back"]', (node) => ({
        target: node.getBoundingClientRect().height,
        paint: parseFloat(getComputedStyle(node, '::before').height),
      }));
      assert.equal(ordinary.target, width === 360 ? 44 : 36);
      if (width === 360)
        assert.equal(ordinary.paint, 36, 'touch retains normal visible button size');

      await open('conversation');
      await page.waitForSelector('[data-testid="conversation-header-identity"]');
      await page.click('[data-testid="conversation-header-identity"]');
      await page.waitForSelector('[data-testid="profile-cover"]');
      await page.click('[data-testid="cover-profile-header-back"]');
      await page.waitForSelector('[data-testid="conversation-header-identity"]');
      assert.equal(
        await page.$eval(
          'input[aria-label="Search messages"]',
          (node) => node.getBoundingClientRect().width === 0 || !!node.closest('[inert]'),
        ),
        true,
        'conversation does not reserve an idle search row',
      );
      await page.type('textarea[aria-label="Message"]', 'See you on Saturday');
      await clickText(page, 'Send');
      await page.waitForFunction(() => document.body.innerText.includes('See you on Saturday'));
      await page.click('button[aria-label="Search messages"]');
      await page.waitForSelector('input[aria-label="Search messages"]', { visible: true });
      await page.click('input[aria-label="Search messages"]');
      await page.type('input[aria-label="Search messages"]', 'coffee');
      await page.waitForFunction(
        () =>
          document.body.innerText.includes('Perfect. Coffee first?') &&
          !document.body.innerText.includes('I will bring my camera.'),
      );
      await page.screenshot({ path: `${output}/conversation-${width}-${theme}.png` });

      await open('pinned-conversation');
      await page.waitForSelector('[data-testid="conversation-header-back"]');
      assert.equal(
        await page.$eval('[data-testid="conversation-header-back"]', (node) =>
          node.textContent.trim(),
        ),
        '23',
      );
      assert((await page.evaluate(() => document.body.innerText)).includes('Pinned message'));

      await open('group-conversation');
      await page.waitForSelector('[data-testid="conversation-header-identity"]');
      const geometry = await page.evaluate(() => {
        const identity = document
          .querySelector('[data-testid="conversation-header-identity"]')
          .getBoundingClientRect();
        const back = document
          .querySelector('[data-testid="conversation-header-back"]')
          .getBoundingClientRect();
        const call = document
          .querySelector('button[aria-label="Start video call"]')
          .getBoundingClientRect();
        return {
          clear: back.right <= identity.left && identity.right <= call.left,
          centered:
            Math.abs(
              (identity.left + identity.right) / 2 -
                document
                  .querySelector('[data-testid="conversation-header"]')
                  .getBoundingClientRect().x -
                document
                  .querySelector('[data-testid="conversation-header"]')
                  .getBoundingClientRect().width /
                  2,
            ) < 1,
          height: identity.height,
          insets: (() => {
            const header = document
              .querySelector('[data-testid="conversation-header"]')
              .getBoundingClientRect();
            return {
              top: back.top - header.top,
              left: back.left - header.left,
              right:
                header.right -
                document.querySelector('[data-bloom-page-header-end]').getBoundingClientRect()
                  .right,
              bottom: header.bottom - identity.bottom,
            };
          })(),
          topAligned:
            Math.abs(back.top - identity.top) < 1 && Math.abs(call.top - identity.top) < 1,
          avatar: document
            .querySelector('[data-testid="conversation-visual"]')
            .getBoundingClientRect().width,
          capsule: document
            .querySelector('[data-testid="conversation-header-title-capsule"]')
            .getBoundingClientRect().height,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert(
        geometry.clear &&
          geometry.centered &&
          geometry.topAligned &&
          geometry.avatar === 48 &&
          geometry.capsule <= 32 &&
          geometry.height >= 80 &&
          geometry.height <= 88 &&
          !geometry.overflow,
        JSON.stringify(geometry),
      );
      assert(
        Math.abs(geometry.insets.top - geometry.insets.left) < 1 &&
          Math.abs(geometry.insets.top - geometry.insets.right) < 1 &&
          Math.abs(geometry.insets.top - geometry.insets.bottom) < 1,
        JSON.stringify(geometry.insets),
      );
      await page.screenshot({ path: `${output}/group-${width}-${theme}.png` });

      await open('cover-profile');
      await page.waitForSelector(
        '[data-testid="cover-profile-header-title-block"][aria-hidden="true"]',
      );
      await page.evaluate(() => window.scrollTo(0, 640));
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-testid="cover-profile-header-title-block"]')
            .getAttribute('aria-hidden') !== 'true',
      );
      const dock = await page.evaluate(() => ({
        header: document
          .querySelector('[data-testid="cover-profile-header"]')
          .getBoundingClientRect().bottom,
        tabs: document.querySelector('[data-testid="profile-content-tabs"]').getBoundingClientRect()
          .top,
      }));
      assert(Math.abs(dock.header - dock.tabs) < 2, JSON.stringify(dock));
      await page.screenshot({ path: `${output}/profile-docked-${width}-${theme}.png` });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForSelector(
        '[data-testid="cover-profile-header-title-block"][aria-hidden="true"]',
      );
      await clickText(page, 'Follow');
      await page.waitForFunction(() => document.body.innerText.includes('Following'));
      await clickText(page, 'About');
      await page.waitForFunction(() => document.body.innerText.includes('March 2022'));

      await open('search-with-suggestions');
      await page.waitForSelector('input[aria-label="Search discoveries"]', { visible: true });
      await page.waitForFunction(
        () =>
          document.querySelector('input[aria-label="Search discoveries"]').getBoundingClientRect()
            .width > 100,
      );
      await page.click('input[aria-label="Search discoveries"]');
      await page.type('input[aria-label="Search discoveries"]', 'forest');
      await page.waitForFunction(() => document.body.innerText.includes('1 results'));
      await clickText(page, 'People');
      await page.waitForFunction(() => document.body.innerText.includes('No discoveries match'));
      await page.click('button[aria-label="Clear search query"]');
      await page.waitForFunction(() => document.body.innerText.includes('2 results'));
      await clickText(page, 'Close search');
      await page.waitForFunction(
        () =>
          document.body.innerText.includes('Discover') &&
          !document.querySelector('input[aria-label="Search discoveries"]'),
      );
      await clickText(page, 'Search');
      await page.waitForSelector('input[aria-label="Search discoveries"]', { visible: true });
      await clickText(page, 'People');
      const result = await page.evaluateHandle(() =>
        [...document.querySelectorAll('[role="listitem"]')].find(
          (node) =>
            node.textContent.includes('Alex Morgan') && node.textContent.includes('Photography'),
        ),
      );
      assert(result.asElement(), 'Result should be an interactive shared list item');
      await result.asElement().click();
      await page.waitForSelector('button[aria-label="Bookmark"]');
      await page.click('button[aria-label="Bookmark"]');
      await page.waitForSelector('button[aria-label="Remove bookmark"]');
      await clickText(page, 'Back to results');
      await page.waitForFunction(() => document.body.innerText.includes('2 results'));
      await page.screenshot({ path: `${output}/search-${width}-${theme}.png` });
      assert.equal(await page.$$eval('button button, button input', (nodes) => nodes.length), 0);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      // A custom title (the housing search pill) must shrink after real fonts
      // settle, just like a string title. Document overflow alone misses this
      // failure because the panel clips the overflowing search control.
      await page.goto(
        `${base}/iframe.html?id=templates-housing--explore&viewMode=story&globals=theme:${theme}`,
        { waitUntil: 'domcontentloaded' },
      );
      await page.waitForSelector('[data-testid="housing-header-title-block"]');
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      const housing = await page.evaluate(() => {
        const header = document
          .querySelector('[data-testid="housing-header"]')
          .getBoundingClientRect();
        const controls = [
          ...document.querySelectorAll(
            '[data-testid="housing-header-title-block"] button, [data-testid="housing-header-title-block"] [role="button"]',
          ),
        ]
          .map((node) => node.getBoundingClientRect())
          .filter((rect) => rect.width > 0)
          .map((rect) => ({ left: rect.left, right: rect.right, width: rect.width }));
        return { left: header.left, right: header.right, controls };
      });
      assert(housing.controls.length > 0, 'Custom housing title has real controls');
      for (const control of housing.controls) {
        assert(
          control.left >= housing.left - 1 && control.right <= housing.right + 1,
          `Custom title control stays inside the header: ${JSON.stringify({ housing, control })}`,
        );
      }
      await page.screenshot({ path: `${output}/housing-${width}-${theme}.png` });
      assert.deepEqual(errors, []);
      console.log(
        `PASS ${width}px ${theme}: identity navigation, count, group geometry, query, profile docking, tabs, follow, filters, close, detail and saved state`,
      );
      await page.close();
    }
  }
} finally {
  await browser.close();
}
