/** Every interactive character story must load the same engine, including custom geometry. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = { stories: [], errors: [], obsoleteRequests: [] };
const directory = '.local/avatar-story-routing';
await mkdir(directory, { recursive: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.on('request', (r) => {
    if (/\.wasm|\.data(?:[?]|$)|editor-compatibility/.test(r.url()))
      report.obsoleteRequests.push(r.url());
  });
  for (const story of ['playground', 'clippo', 'single-eye', 'many-avatars']) {
    await page.goto(
      `http://localhost:6006/iframe.html?id=application-agent-avatar-characters--${story}&viewMode=story`,
    );
    await page.waitForFunction(
      async () => {
        const runtime = globalThis[Symbol.for('bloom.character.runtimes')]?.get(
          new URL('/bloom-character/runtime.mjs', document.baseURI).href,
        );
        if (!runtime) return false;
        const pools = await runtime.diagnostics();
        if (!pools.length || pools.some((p) => p.pending || p.stats.frames < 3)) return false;
        const canvases = [...document.querySelectorAll('canvas')].filter((c) => {
          const r = c.getBoundingClientRect();
          return (
            !c.dataset.avatarRenderer &&
            r.bottom > 0 &&
            r.top < innerHeight &&
            r.right > 0 &&
            r.left < innerWidth
          );
        });
        return (
          canvases.length &&
          canvases.every(
            (c) =>
              c.dataset.avatarEngine === 'new' &&
              c
                .getContext('2d')
                .getImageData(0, 0, c.width, c.height)
                .data.some((v, i) => i % 4 === 3 && v > 32),
          )
        );
      },
      { timeout: 180000 },
    );
    assert(
      !(await page.evaluate(() => document.body.innerText.includes('Avatar unavailable'))),
      `${story}: an avatar failed to load`,
    );
    if (story === 'many-avatars') {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForFunction(
        async () => {
          const pools = await globalThis[Symbol.for('bloom.character.runtimes')]
            .get(new URL('/bloom-character/runtime.mjs', document.baseURI).href)
            .diagnostics();
          return (
            document.body.innerText.includes('Avatar unavailable') ||
            (pools.reduce((n, p) => n + p.avatars, 0) === 48 && pools.every((p) => p.pending === 0))
          );
        },
        { timeout: 180000 },
      );
    }
    const pools = await page.evaluate(() =>
      globalThis[Symbol.for('bloom.character.runtimes')]
        .get(new URL('/bloom-character/runtime.mjs', document.baseURI).href)
        .diagnostics(),
    );
    assert(
      !(await page.evaluate(() => document.body.innerText.includes('Avatar unavailable'))),
      `${story}: an avatar failed to load after scrolling`,
    );
    if (story === 'many-avatars')
      assert.equal(
        pools.reduce((n, p) => n + p.avatars, 0),
        48,
      );
    assert(pools.every((p) => p.stats.contexts === 1));
    const evidence = {
      story,
      avatars: pools.reduce((n, p) => n + p.avatars, 0),
      pools: pools.length,
      presets: [...new Set(pools.flatMap((p) => p.stats.states.map((s) => s.preset)))],
    };
    report.stories.push(evidence);
    console.log(JSON.stringify(evidence));
    await page.screenshot({ path: `${directory}/${story}.png` });
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.obsoleteRequests, []);
} finally {
  await writeFile(`${directory}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
