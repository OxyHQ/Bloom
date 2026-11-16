/**
 * Browser regression for the unified-list prototype's elastic SwipeRow mode.
 * Run with CHROME_PATH and optionally STORYBOOK_URL / PUPPETEER_PATH.
 *
 * Real pointer input measures capsule widths during the drag. Merely checking
 * row translation missed a Reanimated web failure: mappers without direct
 * shared-value dependencies left every capsule at width zero. This gate also
 * checks reversal, release-only dispatch and suppression of the release click.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(
  process.env.PUPPETEER_PATH ?? '/home/nate/Oxy/Homiio/node_modules/puppeteer-core',
);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome',
    headless: true,
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewport({ width: 1440, height: 1080, hasTouch: true });
    await page.goto(
      `${process.env.STORYBOOK_URL ?? 'http://localhost:6006'}/iframe.html?id=unified-lists-demo--playground&viewMode=story`,
      { waitUntil: 'domcontentloaded', timeout: 45000 },
    );
    await page.waitForSelector('[data-testid="unified-row-lumi-swipe"]');
    const row = '[data-testid="unified-row-lumi-swipe"]';
    const bounds = await page.$eval(row, (e) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    const start = { x: bounds.x + bounds.w - 85, y: bounds.y + bounds.h / 2 };
    const widths = () =>
      page.$$eval(
        '[data-testid="unified-row-lumi-swipe-action-pin"], [data-testid="unified-row-lumi-swipe-action-archive"]',
        (els) => els.map((e) => e.getBoundingClientRect().width),
      );
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x - 45, start.y, { steps: 8 });
    await delay(50);
    const small = await widths();
    await page.mouse.move(start.x - 100, start.y, { steps: 8 });
    await delay(50);
    const medium = await widths();
    assert.ok(medium[0] > small[0] && medium[1] > small[1]);

    await page.mouse.up();
    await delay(600);
    await page.waitForSelector('[data-testid="unified-row-lumi-swipe-dismiss"]');
    assert.match(
      await page.$eval('[data-testid="unified-feedback-Gemies"]', (e) => e.textContent),
      /Abre una fila/,
    );
    await page.click('[data-testid="unified-row-lumi-swipe-dismiss"]');
    await delay(600);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x - 220, start.y, { steps: 16 });
    await delay(70);
    assert.match(
      await page.$eval('[data-testid="unified-feedback-Gemies"]', (e) => e.textContent),
      /Abre una fila/,
    );
    const large = await widths();
    assert.ok(large[1] > large[0] * 3);

    // Reversing a drag must cancel its armed action.
    await page.mouse.move(start.x - 35, start.y, { steps: 12 });
    await page.mouse.up();
    await delay(500);
    assert.equal(await page.$$eval(row, (e) => e.length), 1);
    // Long swipe: row remains during the drag, disappears only after release.
    await page.mouse.move(bounds.x + bounds.w - 24, start.y);
    await page.mouse.down();
    await page.mouse.move(bounds.x + 12, start.y, { steps: 24 });
    assert.equal(await page.$$eval(row, (e) => e.length), 1);

    await page.mouse.up();
    await page.waitForSelector(row, { hidden: true });
    assert.match(
      await page.$eval('[data-testid="unified-feedback-Gemies"]', (e) => e.textContent),
      /Archivado: Lumi/,
    );
    assert.equal(
      await page.$$eval(
        '[data-testid="unified-panel-Gemies"] [data-bloom-list-row]',
        (es) => es.length,
      ),
      6,
    );
    assert.ok(!(await page.$eval('body', (e) => e.innerText)).includes('Cómoda'));
    assert.deepEqual(errors, []);
    console.log(
      'PASS: growing capsules, squeezing neighbours, reversal, one full-swipe action on release, compact only, no page errors',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
