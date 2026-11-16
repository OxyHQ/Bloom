/** Ticket details use the real Screen viewport and shared header through the Genie transition. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer-core');
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
const output = '.local/project-board-header';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox'],
  headless: true,
});
const results = [];
try {
  await browser
    .defaultBrowserContext()
    .overridePermissions(new URL(base).origin, ['clipboard-read', 'clipboard-sanitized-write']);
  for (const width of [390, 1280])
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewport({
        width,
        height: 640,
        hasTouch: width === 390,
        isMobile: width === 390,
      });
      await page.goto(
        `${base}/iframe.html?id=templates-project-board--ticket-detail&globals=theme:${theme}`,
        { waitUntil: 'domcontentloaded' },
      );
      await page.waitForSelector('[data-testid="ticket-detail-header"]', { timeout: 45000 });
      await page.waitForFunction(
        () =>
          document.querySelector('.bloom-ticket-detail-genie')?.getAttribute('data-entered') ===
          'true',
      );
      const geometry = await page.evaluate(() => {
        const screen = document.querySelector('[data-testid="ticket-detail-screen"]');
        const header = document.querySelector('[data-testid="ticket-detail-header"]');
        const scrollers = [...screen.querySelectorAll('div')].filter(
          (node) =>
            ['auto', 'scroll'].includes(getComputedStyle(node).overflowY) &&
            node.scrollHeight > node.clientHeight + 8,
        );
        window.ticketScroller = scrollers[0];
        window.ticketHeaderTop = header.getBoundingClientRect().top;
        window.ticketDocumentTop = window.scrollY;
        return {
          screen: screen.getBoundingClientRect().toJSON(),
          header: header.getBoundingClientRect().toJSON(),
          firstContentTop: [...screen.querySelectorAll('[aria-label]')]
            .find((node) => node.getAttribute('aria-label') === 'Description')
            ?.getBoundingClientRect().top,
          scrollers: scrollers.map((node) => ({
            height: node.clientHeight,
            content: node.scrollHeight,
          })),
          buttons: [...header.querySelectorAll('button')].map((node) => ({
            label: node.getAttribute('aria-label'),
            ...node.getBoundingClientRect().toJSON(),
          })),
        };
      });
      assert(geometry.screen.height > 500, 'The panel Screen fills its bounded Genie host');
      assert.equal(geometry.scrollers.length, 1, 'Exactly one bounded content scroller');
      assert(
        geometry.scrollers[0].height > 350,
        'Content has a real viewport, not a zero-height overflow',
      );
      assert(geometry.header.right <= width + 1);
      assert(
        geometry.firstContentTop >= geometry.header.bottom - 1,
        'Initial content clears the measured header',
      );
      for (const button of geometry.buttons) {
        assert(button.width >= (width === 390 ? 44 : 36));
        assert(button.right <= geometry.header.right + 1);
      }
      const point = await page.evaluate(() => {
        const r = window.ticketScroller.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      await page.mouse.move(point.x, point.y);
      await page.mouse.wheel({ deltaY: 350 });
      await page.waitForFunction(() => window.ticketScroller.scrollTop > 100);
      const scroll = await page.evaluate(() => ({
        top: window.ticketScroller.scrollTop,
        documentDelta: window.scrollY - window.ticketDocumentTop,
        headerDelta:
          document.querySelector('[data-testid="ticket-detail-header"]').getBoundingClientRect()
            .top - window.ticketHeaderTop,
      }));
      assert.equal(scroll.documentDelta, 0, 'The panel does not scroll the document behind it');
      assert(Math.abs(scroll.headerDelta) < 1, 'Header stays in its Screen chrome slot');
      await page.click('button[aria-label="Add to favorites"]');
      await page.waitForSelector('button[aria-label="Remove from favorites"]');
      await page.click('button[aria-label="Copy ticket link"]');
      await page.waitForFunction(async () =>
        (await navigator.clipboard.readText()).includes('#ticket='),
      );
      await page.click('button[aria-label="Ticket actions"]');
      await page.waitForSelector('[role="menu"]');
      const menu = await page.$eval('[role="menu"]', (node) => node.textContent);
      assert.match(menu, /Mark as done|Mark done/i);
      await page.keyboard.press('Escape');
      await page.waitForSelector('[role="menu"]', { hidden: true });
      assert(await page.$('[data-testid="ticket-detail-header"]'));
      await page.screenshot({ path: `${output}/${width}-${theme}.png` });
      await page.click('button[aria-label="Close ticket details"]');
      await page.waitForSelector('[data-testid="ticket-detail-header"]', { hidden: true });
      assert.deepEqual(errors, []);
      results.push({ width, theme, geometry, scroll, menu, errors });
      console.log(
        `PASS ticket ${width}/${theme}: bounded scroll, fixed shared header, favorite, clipboard, menu, Escape and close`,
      );
      await page.close();
    }
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
