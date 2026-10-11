/** Repeatable local A/B diagnostic, not a device-independent FPS promise.
 * 100 real composed posts. Disabling optical sampling is a measurement control,
 * never a second public material. Reports all runs, including frame outliers.
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
let puppeteer;
for (const name of ['puppeteer-core', '/home/nate/Oxy/Homiio/node_modules/puppeteer-core']) {
  try {
    puppeteer = require(name);
    break;
  } catch {}
}
if (!puppeteer) throw Error('Install puppeteer-core to measure the feed.');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome',
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(
    `${process.env.STORYBOOK_URL ?? 'http://localhost:6008'}/iframe.html?id=system-composition--dense-feed&viewMode=story`,
    { waitUntil: 'networkidle0' },
  );
  await page.waitForSelector('[data-testid="dense-post-99"]');
  await page.evaluate(() => document.fonts.ready);
  const cdp = await page.createCDPSession();
  await cdp.send('Performance.enable');
  const metrics = async () =>
    Object.fromEntries(
      (await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]),
    );
  const inventory = await page.evaluate(() => ({
    nodes: document.querySelectorAll('*').length,
    posts: document.querySelectorAll('[data-testid^="dense-post-"]').length,
    materialLayers: document.querySelectorAll(
      '.bloom-surface--material,.bloom-surface-paint,.bloom-btn',
    ).length,
  }));
  const runs = [];
  for (const optics of [true, false, false, true]) {
    const override = optics
      ? null
      : await page.addStyleTag({
          content:
            '*::before { backdrop-filter:none !important; -webkit-backdrop-filter:none !important; filter:none !important; }',
        });
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    const before = await metrics();
    const frames = await page.evaluate(async () => {
      const intervals = [];
      let last = performance.now();
      const start = last;
      await new Promise((resolve) => {
        const step = (now) => {
          intervals.push(now - last);
          last = now;
          window.scrollTo(0, (now - start) * 2);
          if (now - start < 2000) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      });
      intervals.shift();
      return intervals;
    });
    const after = await metrics();
    const sorted = [...frames].sort((a, b) => a - b);
    runs.push({
      optics,
      frames: frames.length,
      p50Ms: sorted[Math.floor(sorted.length * 0.5)],
      p95Ms: sorted[Math.floor(sorted.length * 0.95)],
      over32Ms: frames.filter((n) => n > 32).length,
      taskMs: (after.TaskDuration - before.TaskDuration) * 1000,
      layoutMs: (after.LayoutDuration - before.LayoutDuration) * 1000,
      recalcMs: (after.RecalcStyleDuration - before.RecalcStyleDuration) * 1000,
      heapMB: after.JSHeapUsedSize / 1e6,
    });
    await override?.evaluate((element) => element.remove());
  }
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    window.__otherPostMutations = 0;
    window.__postObservers = [...document.querySelectorAll('[data-testid^="dense-post-"]')]
      .slice(1)
      .map((post) => {
        const observer = new MutationObserver(
          (records) => (window.__otherPostMutations += records.length),
        );
        observer.observe(post, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });
        return observer;
      });
  });
  await page.click('[data-testid="dense-like-0"]');
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="dense-like-0"]').getAttribute('aria-pressed') ===
      'true',
  );
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  const otherPostMutations = await page.evaluate(() => {
    window.__postObservers.forEach((o) => o.disconnect());
    return window.__otherPostMutations;
  });
  assert.equal(otherPostMutations, 0, 'one local action must not mutate the other 99 posts');
  assert.deepEqual(errors, []);
  const result = {
    browser: await browser.version(),
    environment: 'local Storybook development build, headless Chrome; no GPU/device parity claim',
    inventory,
    runs,
    otherPostMutations,
    errors,
  };
  if (process.env.REPORT_PATH)
    writeFileSync(process.env.REPORT_PATH, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
