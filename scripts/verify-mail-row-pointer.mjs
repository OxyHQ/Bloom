/**
 * Real Chrome pointer gate for MailRow. Synthetic element.click() bypasses the
 * defect: an inert foreground layout View can intercept the absolute row link.
 * Run Storybook, then CHROME_PATH=<chrome> node scripts/verify-mail-row-pointer.mjs [--url URL].
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('/home/nate/Oxy/Homiio/node_modules/puppeteer-core');
const index = process.argv.indexOf('--url');
const base = index < 0 ? 'http://localhost:6006' : process.argv[index + 1];
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome',
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 900 });
  await page.goto(`${base}/iframe.html?id=blocks-mail-mail-list--pointer-targets&viewMode=story`, {
    waitUntil: 'networkidle0',
  });
  await page.waitForSelector('[data-testid="hit-comfortable"]');
  // Negative control: restoring the original intercepting layout must block
  // the same coordinates the positive cases will click.
  const detectsOldBug = await page.evaluate(() => {
    const row = document.querySelector('[data-testid="hit-comfortable"]');
    const foreground = row.children[1];
    const sender = document.querySelector('[data-testid="hit-comfortable-sender"]');
    const r = sender.getBoundingClientRect();
    foreground.style.setProperty('pointer-events', 'auto', 'important');
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    foreground.style.removeProperty('pointer-events');
    return hit === foreground;
  });
  if (!detectsOldBug) throw new Error('Negative control did not reproduce foreground interception');
  let opens = 0;
  const count = (id) => page.$eval(`[data-testid="${id}"]`, (e) => Number(e.textContent));
  for (const density of ['compact', 'comfortable']) {
    for (const part of [
      'sender',
      'subject',
      'avatar',
      'time',
      'attachment',
      'thread-count',
      'padding',
    ]) {
      const point = await page.evaluate(
        ({ density, part }) => {
          const row = document.querySelector(`[data-testid="hit-${density}"]`);
          const element =
            part === 'padding'
              ? row
              : document.querySelector(`[data-testid="hit-${density}-${part}"]`);
          const r = element.getBoundingClientRect();
          const x = part === 'padding' ? r.left + 2 : r.left + r.width / 2;
          const y = r.top + r.height / 2;
          return { x, y, hit: document.elementFromPoint(x, y)?.getAttribute('data-testid') };
        },
        { density, part },
      );
      if (point.hit !== `hit-${density}-link`)
        throw new Error(`${density}/${part}: foreground intercepted pointer (${point.hit})`);
      await page.mouse.click(point.x, point.y);
      if ((await count('hit-opened')) !== ++opens)
        throw new Error(`${density}/${part}: click did not open exactly once`);
    }
    const beforeStar = await page.$eval(`[data-testid="hit-${density}-star"]`, (e) =>
      e.getAttribute('aria-pressed'),
    );
    await page.click(`[data-testid="hit-${density}-star"]`);
    const afterStar = await page.$eval(`[data-testid="hit-${density}-star"]`, (e) =>
      e.getAttribute('aria-pressed'),
    );
    if (beforeStar === afterStar) throw new Error(`${density}: star did not toggle`);
    if ((await count('hit-opened')) !== opens) throw new Error(`${density}: star opened the row`);
  }
  await page.click('[data-testid="hit-selection-checkbox"]');
  if ((await count('hit-opened')) !== opens) throw new Error('Selection opened the row');
  await page.hover('[data-testid="hit-actions"]');
  await page.waitForSelector('[data-testid="hit-actions-action-archive"]', { visible: true });
  await page.click('[data-testid="hit-actions-action-archive"]');
  if ((await count('hit-archived')) !== 1 || (await count('hit-opened')) !== opens)
    throw new Error('Archive action routing failed');
  console.log(
    `PASS: ${opens} real row clicks across both densities; stars, checkbox and archive stay independent`,
  );
} finally {
  await browser.close();
}
