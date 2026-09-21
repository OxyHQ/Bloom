/** Real wheel events must reach the document, including over either social rail.
 * STORYBOOK_URL, PUPPETEER_MODULE and CHROME_PATH follow verify-storybook-layout.mjs.
 * Pass story ids to limit the check; requires enough content to overflow 700px.
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer-core');
const stories = process.argv.slice(2);
if (!stories.length) stories.push('templates-social--light-olive', 'templates-social--dark-olive', 'templates-social--open-columns', 'templates-social--tall-context', 'templates-workspace--tonal-olive', 'templates-home-dashboard--default');
const browser = await puppeteer.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }),
  headless: true, args: ['--no-sandbox'],
});
const failures = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', error => failures.push(error.message));
  for (const id of stories) for (const width of [1440, 390]) {
    // The full social navigation needs enough height to fit before a wheel
    // over it can be expected to reach the document. Short windows deliberately
    // scroll the destinations while keeping the primary action visible.
    const height = id.startsWith('templates-social') && width === 1440 ? 900 : 700;
    await page.setViewport({ width, height });
    const url = new URL('iframe.html', process.env.STORYBOOK_URL ?? 'http://localhost:6014');
    url.searchParams.set('id', id); url.searchParams.set('viewMode', 'story');
    await page.goto(url.href, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-bloom-story-scroll="document"]');
    const before = await page.evaluate(() => ({
      range: document.documentElement.scrollHeight - innerHeight,
      overflow: document.documentElement.scrollWidth - innerWidth,
      inner: [...document.querySelectorAll('[data-bloom-story-layout] *')].filter(el => {
        const css = getComputedStyle(el);
        return /^(auto|scroll)$/.test(css.overflowY) && el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 2;
      }).map(el => ({ tag: el.tagName, id: el.getAttribute('data-testid') })),
    }));
    if (before.range < 100 || before.overflow > 1 || before.inner.length) failures.push(`${id} @${width}: ${JSON.stringify(before)}`);
    const selectors = id.startsWith('templates-social')
      ? ['social-main', ...(width > 1180 ? ['social-navigation', 'social-aside'] : [])]
      : [];
    const positions = selectors.length ? await page.evaluate(ids => ids.map(id => {
      const r = document.querySelector(`[data-testid="${id}"]`).getBoundingClientRect();
      return { id, x: r.x + r.width / 2, y: Math.max(40, Math.min(r.y + 150, innerHeight - 100)) };
    }), selectors) : [{ id: 'page', x: width / 2, y: 200 }];
    for (const position of positions) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.mouse.move(position.x, position.y);
      await page.mouse.wheel({ deltaY: 360 });
      try { await page.waitForFunction(() => window.scrollY > 100, { timeout: 3000 }); }
      catch { failures.push(`${id} @${width}: wheel over ${position.id} did not scroll document`); }
    }
    const after = await page.evaluate(() => ({
      y: scrollY,
      navTop: document.querySelector('[data-testid="social-navigation"]')?.getBoundingClientRect().top,
      bottom: document.querySelector('[data-testid="social-navigation-bottom"]')?.getBoundingClientRect().bottom,
    }));
    if (id.startsWith('templates-social') && width > 1180 && Math.abs(after.navTop ?? 999) > 25) failures.push(`${id}: navigation did not stay sticky: ${after.navTop}`);
    if (id.startsWith('templates-social') && width === 390 && (after.bottom === undefined || after.bottom > 701 || after.bottom < 550)) failures.push(`${id}: mobile navigation left viewport: ${after.bottom}`);
    if (id.startsWith('templates-social')) {
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const end = await page.evaluate(() => {
        const content = document.querySelector('[data-testid="social-main"]');
        const last = content?.lastElementChild?.getBoundingClientRect();
        const bottomBar = document.querySelector('[data-testid="social-navigation-bottom"]')?.getBoundingClientRect();
        const aside = document.querySelector('[data-testid="social-aside"]')?.getBoundingClientRect();
        return { lastBottom: last?.bottom, available: bottomBar?.top ?? innerHeight, asideBottom: aside?.bottom, height: innerHeight };
      });
      if (end.lastBottom === undefined || end.lastBottom > end.available + 1) failures.push(`${id} @${width}: last content obscured: ${JSON.stringify(end)}`);
      if (width > 1180 && end.asideBottom > end.height + 1) failures.push(`${id}: end of context unreachable: ${JSON.stringify(end)}`);
    }
    console.log(`${id} @${width}: ${JSON.stringify({ ...before, ...after })}`);
  }
} finally { await browser.close(); }
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
