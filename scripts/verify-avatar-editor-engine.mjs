/** Exercise the actual editor and catalog through the single shared renderer. */
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
const report = { cases: [], errors: [], failedAssets: [], obsoleteRequests: [] };
const output = '.local/avatar-editor-engine';
await mkdir(output, { recursive: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1100 });
  page.on('request', (r) => {
    if (/\.wasm|\.data(?:[?]|$)|editor-compatibility/.test(r.url()))
      report.obsoleteRequests.push(r.url());
  });
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.on('response', (r) => {
    if (r.status() >= 400 && /bloom-character|runtime\/avatar/.test(r.url()))
      report.failedAssets.push(r.url());
  });
  await page.goto(
    'http://localhost:6006/iframe.html?id=application-agent-avatar-characters--editor&viewMode=story',
  );
  await page.waitForSelector(
    '[data-testid="universal-avatar-preview"] canvas[data-avatar-engine="new"]',
    { timeout: 90000 },
  );
  await page.evaluate(() => {
    window.editorDiagnostics = () =>
      globalThis[Symbol.for('bloom.character.runtimes')]
        .get(new URL('/bloom-character/runtime.mjs', document.baseURI).href)
        .diagnostics();
    window.editorPixels = () => {
      const c = document.querySelector('[data-testid="universal-avatar-preview"] canvas');
      const pixels = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let painted = 0,
        blue = 0;
      for (let i = 0; i < pixels.length; i += 4)
        if (pixels[i + 3] > 24) {
          painted++;
          if (pixels[i + 2] > pixels[i] * 1.4 && pixels[i + 2] > pixels[i + 1] * 1.1) blue++;
        }
      return { painted, blue, backend: c.dataset.avatarEngine };
    };
  });
  await page.waitForFunction(
    async () => (await editorDiagnostics()).some((p) => p.avatars === 2 && p.stats.frames > 3),
    { timeout: 90000 },
  );
  await page.waitForFunction(
    async () => (await editorDiagnostics()).every((p) => p.pending === 0),
    { timeout: 90000 },
  );
  const initial = await page.evaluate(async () => ({
    pools: await editorDiagnostics(),
    pixels: editorPixels(),
  }));
  const previews = initial.pools.filter((p) => p.cell === 320 && p.avatars === 2);
  assert.equal(previews.length, 1, 'Both animated previews share their resolution pool');
  assert(initial.pools.every((p) => p.stats.contexts === 1));
  // Selectors without authored PNGs use paused portraits in a smaller shared pool.
  const portraits = initial.pools.filter((p) => p !== previews[0]);
  assert(portraits.every((p) => p.cell <= 128));
  const portraitFrames = portraits.map((p) => p.stats.frames);
  await new Promise((resolve) => setTimeout(resolve, 300));
  const settled = await page.evaluate(() => editorDiagnostics());
  assert.deepEqual(
    settled.filter((p) => p.cell <= 128).map((p) => p.stats.frames),
    portraitFrames,
  );
  assert(initial.pixels.painted > 10000);
  report.cases.push({
    name: 'two-live-editor-previews-share-one-context',
    avatars: 2,
    contexts: 1,
  });
  const clickText = async (text) => {
    for (const button of await page.$$('button,[role="button"]')) {
      if (await button.evaluate((el, text) => el.textContent.trim() === text, text)) {
        await button.click();
        return;
      }
    }
    throw Error(`Missing editor control ${text}`);
  };
  await clickText('Reaction');
  await page.waitForFunction(async () =>
    (await editorDiagnostics()).some((p) => p.stats.states.some((s) => s.motion === 'reaction')),
  );
  await page.waitForFunction(
    async () =>
      (await editorDiagnostics()).every((p) => p.stats.states.every((s) => s.motion === 'idle')),
    { timeout: 30000 },
  );
  await clickText('Working');
  await page.waitForFunction(async () =>
    (await editorDiagnostics()).some((p) => p.stats.states.some((s) => s.motion === 'work')),
  );
  await page.waitForFunction(
    async () =>
      (await editorDiagnostics()).every((p) => p.stats.states.every((s) => s.motion === 'idle')),
    { timeout: 30000 },
  );
  report.cases.push({ name: 'real-reaction-and-computer-controls', returnedToIdle: true });
  await page.click('[aria-label="Blue avatar"]');
  await page.waitForFunction(() => editorPixels().blue > editorPixels().painted * 0.25, {
    timeout: 30000,
  });
  assert.equal(await page.evaluate(() => editorPixels().backend), 'new');
  assert.equal(
    (await page.evaluate(() => editorDiagnostics()))
      .filter((p) => p.cell === 320)
      .reduce((n, p) => n + p.avatars, 0),
    2,
  );
  report.cases.push({ name: 'color-picker-updates-both-new-engine-previews' });
  await page.screenshot({ path: `${output}/new-engine-editor.png` });
  const choose = async (label, title) => {
    const button = await page.$(`[aria-label="${label}"]`);
    assert(button, label);
    await button.click();
    await page.waitForSelector('[role="radio"]');
    for (const radio of await page.$$('[role="radio"]')) {
      if (
        await radio.evaluate(
          (el, title) => el.getAttribute('aria-label') === title || el.textContent.trim() === title,
          title,
        )
      ) {
        await radio.click();
        return;
      }
    }
    throw Error(`Missing option ${title}`);
  };
  await choose('Accessory', 'Crown');
  await page.waitForFunction(
    async () =>
      editorPixels().backend === 'new' &&
      editorPixels().painted > 10000 &&
      (await editorDiagnostics()).some(
        (p) => p.pending === 0 && p.stats.states.some((s) => s.preset.includes('crown')),
      ),
    { timeout: 180000 },
  );
  assert(
    (await page.$eval('[data-testid="universal-avatar-config"]', (el) => el.textContent)).includes(
      'crown',
    ),
  );
  report.cases.push({ name: 'custom-accessory-renders-on-shared-engine', accessory: 'crown' });
  await clickText('Reaction');
  await page.waitForFunction(async () =>
    (await editorDiagnostics()).some((p) =>
      p.stats.states.some((s) => s.preset.includes('crown') && s.motion === 'reaction'),
    ),
  );
  await clickText('Working');
  await page.waitForFunction(async () =>
    (await editorDiagnostics()).some((p) =>
      p.stats.states.some((s) => s.preset.includes('crown') && s.motion === 'work'),
    ),
  );
  await page.screenshot({ path: `${output}/custom-crown-computer.png` });
  report.cases.push({ name: 'custom-catalog-reaction-and-computer-controls' });
  await choose('Accessory', 'Tuft');
  await page.waitForFunction(
    async () =>
      (await editorDiagnostics()).some(
        (p) => p.pending === 0 && p.stats.states.some((s) => s.preset.includes('three_lobe')),
      ) && editorPixels().blue > editorPixels().painted * 0.25,
    { timeout: 90000 },
  );
  await page.screenshot({ path: `${output}/integrated-tuft-editor.png` });
  report.cases.push({ name: 'real-editor-tuft-keeps-selected-body-color' });
  await choose('Avatar style', 'Todd');
  await page.waitForFunction(
    async () =>
      editorPixels().backend === 'new' &&
      editorPixels().painted > 10000 &&
      (await editorDiagnostics()).some((p) => p.avatars === 2),
    { timeout: 90000 },
  );
  assert.equal(
    (await page.evaluate(() => editorDiagnostics())).filter((p) => p.cell === 320).length,
    1,
  );
  report.cases.push({ name: 'preset-change-keeps-shared-engine' });
  await page.goto(
    'http://localhost:6006/iframe.html?id=application-agent-creator--basic&viewMode=story',
  );
  await page.waitForFunction(
    () => {
      const c = document.querySelector('canvas[data-avatar-engine="new"]');
      if (!c || c.width < 2) return false;
      return c
        .getContext('2d')
        .getImageData(0, 0, c.width, c.height)
        .data.some((v, i) => i % 4 === 3 && v > 32);
    },
    { timeout: 90000 },
  );
  const creatorPools = await page.evaluate(() =>
    globalThis[Symbol.for('bloom.character.runtimes')]
      .get(new URL('/bloom-character/runtime.mjs', document.baseURI).href)
      .diagnostics(),
  );
  assert.equal(creatorPools.filter((p) => p.cell === 320).length, 1);
  assert(creatorPools.every((p) => p.stats.contexts === 1));
  report.cases.push({ name: 'agent-creator-basic-renders-with-new-engine', contexts: 1 });
  assert.deepEqual(report.obsoleteRequests, []);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.failedAssets, []);
  console.log(JSON.stringify(report));
} catch (error) {
  const pages = await browser.pages();
  report.failure = {
    message: error.message,
    diagnostics: await pages
      .at(-1)
      .evaluate(() => window.editorDiagnostics?.())
      .catch(() => null),
  };
  throw error;
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
