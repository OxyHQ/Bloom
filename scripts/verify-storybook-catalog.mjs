/** Render every indexed story using the real preview, recording failures and viewport overflow.
 * PUPPETEER_PATH / CHROME_PATH select the local browser; STORYBOOK_URL defaults to :6006.
 * STORY_IDS optionally limits a follow-up run; CATALOG_PROFILE=mobile-dark selects touch/dark.
 * Overflow is evidence to review (some fixtures deliberately overflow), not an automatic failure.
 */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_PATH ?? 'puppeteer-core');
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
const profile = process.env.CATALOG_PROFILE ?? 'desktop-light';
const mobile = profile.startsWith('mobile');
const dark = profile.endsWith('dark');
const index = await fetch(`${base}/index.json`).then((response) => response.json());
const selected = process.env.STORY_IDS?.split(',');
const stories = Object.values(index.entries).filter(
  (entry) => entry.type === 'story' && (!selected || selected.includes(entry.id)),
);
const output = process.env.CATALOG_REPORT ?? `.local/storybook-catalog/${profile}.json`;
await mkdir(output.slice(0, output.lastIndexOf('/')) || '.', { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
const results = [];
let cursor = 0;
async function worker() {
  // Preview channels and globals must not leak between simultaneously rendered stories.
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: mobile ? 390 : 1280, height: 900, hasTouch: mobile });
  let errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  async function bootstrap() {
    await page.goto(
      `${base}/iframe.html?id=base-button--basic&viewMode=story&globals=theme:${dark ? 'dark' : 'light'}`,
      { waitUntil: 'domcontentloaded' },
    );
    await page.waitForFunction(
      () => window.__STORYBOOK_ADDONS_CHANNEL__ && document.querySelector('.bloom-btn'),
      { timeout: 90000 },
    );
  }
  let reset = true;
  while (cursor < stories.length) {
    const story = stories[cursor++];
    errors = [];
    const start = Date.now();
    let outcome;
    try {
      if (reset || !(await page.evaluate(() => Boolean(window.__STORYBOOK_ADDONS_CHANNEL__)))) {
        await bootstrap();
        reset = false;
        errors = [];
      }
      outcome = await page.evaluate(
        (id) =>
          new Promise((resolve) => {
            const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
            let timer;
            const finish = (status, detail) => {
              clearTimeout(timer);
              for (const [event, listener] of listeners) channel.off(event, listener);
              resolve({ status, detail });
            };
            const listeners = [
              [
                'storyRendered',
                (rendered) => {
                  if (rendered === id) finish('rendered');
                },
              ],
              ['storyErrored', (error) => finish('error', error)],
              [
                'storyThrewException',
                (error) => finish('exception', { message: error.message, stack: error.stack }),
              ],
              ['storyMissing', (missing) => finish('missing', missing)],
            ];
            for (const [event, listener] of listeners) channel.on(event, listener);
            timer = setTimeout(() => finish('timeout'), 20000);
            channel.emit('setCurrentStory', { storyId: id, viewMode: 'story' });
          }),
        story.id,
      );
      reset = outcome.status !== 'rendered';
      await new Promise((resolve) => setTimeout(resolve, 150));
      const layout = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        const overflow =
          Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - width;
        return {
          overflow,
          content: document.querySelector('#storybook-root')?.textContent?.slice(0, 100),
          errorScreen: document.querySelector('.sb-errordisplay')?.textContent?.slice(0, 800),
        };
      });
      results.push({
        id: story.id,
        file: story.importPath,
        ...outcome,
        errors: [...errors],
        layout,
        ms: Date.now() - start,
      });
    } catch (error) {
      reset = true;
      results.push({
        id: story.id,
        file: story.importPath,
        status: 'harness-error',
        detail: error.message,
        errors: [...errors],
      });
    }
    if (results.length % 50 === 0) {
      await writeFile(
        output,
        JSON.stringify({ profile, indexed: stories.length, results }, null, 2),
      );
      console.log(`${profile}: ${results.length}/${stories.length}`);
    }
  }
  await context.close();
}
try {
  await Promise.all(Array.from({ length: Number(process.env.CATALOG_WORKERS ?? 3) }, worker));
} finally {
  await browser.close();
  results.sort((a, b) => a.id.localeCompare(b.id));
  await writeFile(output, JSON.stringify({ profile, indexed: stories.length, results }, null, 2));
}
const failures = results.filter((result) => result.status !== 'rendered' || result.errors.length);
console.log(
  `${results.filter((result) => result.status === 'rendered').length}/${stories.length} rendered; ${failures.length} failures; report: ${output}`,
);
if (failures.length) process.exitCode = 1;
