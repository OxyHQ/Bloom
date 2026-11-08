/** Capture one shared fixture in light/dark over solid, stripe, photo and moving
 * backgrounds. Pixel artifacts require review: a capture is not a parity verdict. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_PATH || 'puppeteer-core');
const base = process.env.STORYBOOK_URL || 'http://localhost:6006';
const out = resolve(process.env.OUT || '.local/material-comparison');
mkdirSync(out, { recursive: true });
const index = await (await fetch(`${base}/index.json`)).json();
const story = Object.values(index.entries).find(
  (entry) =>
    entry.importPath === './templates/material/Material.stories.tsx' &&
    entry.exportName === 'Comparison',
);
assert(story, 'Shared material comparison story missing');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
const report = {
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  workingTree: execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(),
  browser: await browser.version(),
  viewport: { width: 390, height: 844, deviceScaleFactor: 1 },
  captures: [],
};
const wait = (ms) => new Promise((done) => setTimeout(done, ms));
try {
  const page = await browser.newPage();
  const errors = [];
  const external = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    if (/^https?:/.test(url) && new URL(url).origin !== new URL(base).origin) {
      external.push(url);
      request.abort();
    } else request.continue();
  });
  await page.setViewport(report.viewport);
  await page.goto(
    `${base}/iframe.html?id=${story.id}&viewMode=story&globals=theme:light;material:standard`,
  );
  await page.waitForSelector('[data-testid="material-surface"]');
  const click = (name) => page.click(`[data-testid="material-${name}"]`);
  const capture = async (name, state) => {
    await wait(650);
    const label = await page.$eval('[data-testid="material-build"]', (node) => node.textContent);
    assert(
      label.includes(state.theme) && label.includes(state.background),
      `Unexpected scene state: ${label}`,
    );
    const geometry = await page.evaluate(() =>
      Object.fromEntries(
        ['surface', 'card', 'island', 'tabbar', 'composer', 'loader'].map((role) => {
          const node = document.querySelector(`[data-testid="material-${role}"]`);
          if (!node) throw new Error(`Missing material role ${role}`);
          const { x, y, width, height } = node.getBoundingClientRect();
          return [role, { x, y, width, height }];
        }),
      ),
    );
    await page.screenshot({ path: `${out}/${name}.png` });
    report.captures.push({ name, ...state, geometry });
  };
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') {
      await click('theme');
      await page.waitForFunction(() =>
        document.querySelector('[data-testid="material-build"]').textContent.includes('dark'),
      );
    }
    for (const background of ['solid', 'stripes', 'photo', 'motion']) {
      await click(`background-${background}`);
      if (background === 'photo' || background === 'motion') {
        await page.waitForFunction(() =>
          Array.from(document.images).some((image) => image.complete && image.naturalWidth > 0),
        );
      }
      await capture(`${theme}-${background}`, { theme, background, overlay: null });
      if (background === 'motion' && process.env.RECORD_VIDEO === '1') {
        const recording = await page.screencast({ path: `${out}/${theme}-motion.webm`, fps: 30 });
        await wait(8500);
        await recording.stop();
      }
      await click('menu-trigger');
      await page.waitForSelector('[data-testid="material-menu"]');
      await capture(`${theme}-${background}-menu`, { theme, background, overlay: 'menu' });
      await page.keyboard.press('Escape');
      await page.waitForSelector('[data-testid="material-menu"]', { hidden: true });
      await click('dialog-trigger');
      await page.waitForSelector('[data-testid="material-dialog-close"]');
      await capture(`${theme}-${background}-dialog`, { theme, background, overlay: 'dialog' });
      await click('dialog-close');
      await page.waitForSelector('[data-testid="material-dialog-close"]', { hidden: true });
      await click('sheet-trigger');
      await page.waitForSelector('[data-testid="material-sheet-close"]');
      await capture(`${theme}-${background}-sheet`, { theme, background, overlay: 'sheet' });
      await click('sheet-close');
      await page.waitForSelector('[data-testid="material-sheet-close"]', { hidden: true });
    }
    await click('transparency');
    await capture(`${theme}-motion-reduced-transparency`, {
      theme,
      background: 'motion',
      reducedTransparency: true,
    });
    await click('transparency');
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(external, [], 'Fixture must not fetch external assets or services');
  writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(`Captured ${report.captures.length} states with real overlay dismissal: ${out}`);
} finally {
  await browser.close();
}
