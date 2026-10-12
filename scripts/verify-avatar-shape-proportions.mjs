/** Review the actual Storybook gallery, including face styles, eyewear and actions. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const output = '.local/avatar-shape-proportions',
  report = { cases: [], errors: [] };
await mkdir(output, { recursive: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1250 });
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.on('console', (m) => {
    if (/GL_INVALID|GL_OUT_OF_MEMORY/.test(m.text())) report.errors.push(m.text());
  });
  await page.goto(
    'http://localhost:6006/iframe.html?id=application-agent-avatar-characters--shape-proportions&viewMode=story',
  );
  await page.waitForSelector('[data-testid="shape-proportions-circle"] canvas', {
    timeout: 120000,
  });
  await page.evaluate(() => {
    window.galleryDiagnostics = () =>
      globalThis[Symbol.for('bloom.character.runtimes')]
        .get(new URL('/bloom-character/runtime.mjs', document.baseURI).href)
        .diagnostics();
  });
  const ready = async (eyes) => {
    await page.waitForFunction(
      async (eyes) => {
        const pools = await galleryDiagnostics(),
          states = pools.flatMap((p) => p.stats.states);
        return (
          pools.every((p) => p.pending === 0) &&
          states.length === 20 &&
          states.filter((s) => s.preset.includes(`"eyes":"${eyes}"`)).length ===
            (eyes === 'clippo' ? 20 : 19) &&
          [...document.querySelectorAll('[data-testid^="shape-proportions-"] canvas')].length === 20
        );
      },
      { timeout: 180000 },
      eyes,
    );
    assert.equal(
      await page.evaluate(() => document.body.textContent.includes('Avatar unavailable')),
      false,
    );
  };
  const click = async (label) => {
    const handle = await page.evaluateHandle(
      (label) =>
        [...document.querySelectorAll('[role="button"],button')].find(
          (button) => button.textContent.trim() === label,
        ),
      label,
    );
    const button = handle.asElement();
    if (!button) throw Error(`Missing control ${label}`);
    await button.click();
    await handle.dispose();
  };
  await ready('todd');
  await click('Pause');
  for (const eyes of ['todd', 'oval', 'crescent_inset', 'cyclops']) {
    if (eyes !== 'todd') {
      await click(eyes);
      await ready(eyes);
    }
    await page.screenshot({ path: `${output}/${eyes}.png` });
    report.cases.push({ eyes, avatars: 20 });
  }
  await click('Add glasses');
  await page.waitForFunction(
    async () => {
      const pools = await galleryDiagnostics();
      return (
        pools.every((p) => p.pending === 0) &&
        pools.flatMap((p) => p.stats.states).every((s) => s.preset.includes('monocle'))
      );
    },
    { timeout: 180000 },
  );
  await page.screenshot({ path: `${output}/cyclops-monocle.png` });
  // Observe before the input: software GL may spend an entire short action
  // between the remote click returning and the next browser protocol request.
  await page.evaluate(() => {
    window.observedGalleryMotions = new Set();
    window.observedGalleryAvatars = new Map();
    window.observeGalleryMotions = true;
    const observe = async () => {
      for (const pool of await galleryDiagnostics())
        for (const state of pool.stats.states) {
          observedGalleryMotions.add(state.motion);
          const motions = observedGalleryAvatars.get(state.preset) ?? new Set();
          motions.add(state.motion);
          observedGalleryAvatars.set(state.preset, motions);
        }
      if (window.observeGalleryMotions) requestAnimationFrame(observe);
    };
    requestAnimationFrame(observe);
  });
  await click('Resume');
  await click('Reaction');
  await page.waitForFunction(
    () =>
      observedGalleryAvatars.size === 20 &&
      [...observedGalleryAvatars.values()].every((motions) => motions.has('reaction')),
    { timeout: 30000 },
  );
  await click('Computer');
  await page.waitForFunction(
    () =>
      observedGalleryAvatars.size === 20 &&
      [...observedGalleryAvatars.values()].every((motions) => motions.has('work')),
    { timeout: 30000 },
  );
  await page.waitForFunction(
    async () =>
      (await galleryDiagnostics()).every((p) => p.stats.states.every((s) => s.motion === 'idle')),
    { timeout: 30000 },
  );
  await page.evaluate(() => {
    window.observeGalleryMotions = false;
  });
  report.cases.push({
    eyes: 'cyclops',
    eyewear: 'monocle',
    actions: ['reaction', 'computer', 'idle'],
    avatars: 20,
  });
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report));
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
