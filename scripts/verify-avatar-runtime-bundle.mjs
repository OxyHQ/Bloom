/** Verify the distributed ESM directly; no Storybook registration or source imports. */
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
const report = { errors: [], obsoleteRequests: [], cases: [] };
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.on('request', (r) => {
    if (/\.wasm(?:\?|$)|orbit-characters|\/runtime\/avatar/.test(r.url()))
      report.obsoleteRequests.push(r.url());
  });
  page.on('console', (m) => {
    if (/GL_INVALID|GL_OUT_OF_MEMORY/.test(m.text())) report.errors.push(m.text());
  });
  await page.setRequestInterception(true);
  page.on('request', (r) =>
    r.url().endsWith('/standalone-avatar.html')
      ? r.respond({
          contentType: 'text/html',
          body: '<!doctype html><body style="margin:0;display:flex"></body>',
        })
      : r.continue(),
  );
  await page.goto('http://localhost:6006/standalone-avatar.html');
  await page.evaluate(async () => {
    const url = new URL('/bloom-character/runtime.mjs', location.href).href;
    const runtime = await import(url);
    if (typeof runtime.createAvatar !== 'function')
      throw Error('Public createAvatar export missing');
    window.diag = () => globalThis[Symbol.for('bloom.character.runtimes')].get(url).diagnostics();
    const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
    const { characterFromLegacy } = await import('/src/agent-avatar/legacy-character.ts');
    // These gates still write a character as `{ preset, selections }`; the renderer takes it resolved.
    const resolved = (nested) => resolveAvatarCharacter(characterFromLegacy({ character: nested }));
    window.canvases = [];
    window.controllers = [];
    window.props = [];
    const recipes = [
      { preset: 'blue_beret' },
      {
        preset: 'lime_frog',
        selections: { shape: 'heart', eyes: 'todd', accessory: 'three_lobe' },
      },
      {
        preset: 'blue_spectacles',
        selections: { shape: 'cloud', eyes: 'cyclops', accessory: 'three_lobe' },
      },
    ];
    await Promise.all(
      recipes.map(async (character, i) => {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'width:128px;height:128px';
        document.body.append(canvas);
        canvases[i] = canvas;
        const value = {
          character: resolved(character),
          reduced: false,
          reactionKey: 0,
          workingKey: 0,
          entranceKey: 0,
        };
        props[i] = value;
        controllers[i] = await runtime.createAvatar(canvas, value, {
          onError() {
            throw Error('Distributed runtime failed');
          },
        });
      }),
    );
  });
  await page.waitForFunction(
    async () =>
      (await diag()).reduce((n, p) => n + p.avatars, 0) === 3 &&
      canvases.every((c) => {
        const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        return data.some((v, i) => i % 4 === 3 && v > 20);
      }),
    { timeout: 90000 },
  );
  const initial = await page.evaluate(async () => ({
    pools: await diag(),
    urls: performance.getEntriesByType('resource').map((e) => e.name),
  }));
  assert.equal(initial.pools.length, 1);
  assert.equal(initial.pools[0].stats.contexts, 1);
  assert(
    initial.urls.some((url) => url.includes('/bloom-character/assets/') && url.includes('.bin')),
  );
  report.cases.push('published ESM and lazy assets render three recipes in one context');
  await page.evaluate(async () => {
    await controllers[1].update({ ...props[1], workingKey: 1, workingCycles: 2 });
  });
  await page.waitForFunction(async () =>
    (await diag())[0].stats.states.some((s) => s.preset.includes('heart') && s.motion === 'work'),
  );
  report.cases.push('published Computer accepts repeated episodes');
  await page.evaluate(async () => {
    await controllers[2].update({ ...props[2], entranceKey: 1, reactionKey: 1 });
  });
  await page.waitForFunction(async () =>
    (await diag())[0].stats.states.some(
      (s) => s.preset.includes('cloud') && s.motion === 'reaction',
    ),
  );
  report.cases.push('published entrance and reaction');
  await page.evaluate(() => controllers.forEach((c) => c.dispose()));
  assert.equal(await page.evaluate(async () => (await diag()).length), 0);
  report.cases.push('last disposal releases the shared renderer');
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.obsoleteRequests, []);
  console.log(JSON.stringify(report));
} finally {
  await mkdir('.local/avatar-runtime-bundle', { recursive: true });
  await writeFile('.local/avatar-runtime-bundle/report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
