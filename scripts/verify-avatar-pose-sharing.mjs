/** Exact same-context scalar/control pixels and per-frame sampling counters. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const origin = process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007';
const output = process.env.AVATAR_POSE_OUTPUT || '.local/avatar-pose-sharing-browser';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  protocolTimeout: 180000,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = { cases: [], errors: [] };
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => report.errors.push(e.message));
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*/avatar-pose-sharing.html' }] });
  cdp.on('Fetch.requestPaused', (e) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: e.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from(
        '<!doctype html><body style="margin:0"><canvas style="width:384px;height:256px"></canvas></body>',
      ).toString('base64'),
    }),
  );
  await page.goto(`${origin}/avatar-pose-sharing.html`);
  await cdp.send('Fetch.disable');
  report.cases = await page.evaluate(async () => {
    const { AuthoredAvatarEngine } = await import('/runtime/avatar/authored-engine.ts');
    const { createCatalogAssetResolver } = await import('/runtime/avatar/catalog-assets.ts');
    const { createCatalogMotion } = await import('/runtime/avatar/catalog-motion-factory.ts');
    const { resolveCompleteEditorRecipe } = await import('/runtime/avatar/recipe.ts');
    const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
    const canvas = document.querySelector('canvas');
    let last, engine;
    engine = new AuthoredAvatarEngine(canvas, {
      count: 24,
      size: 64,
      lazyWork: true,
      resolveAsset: createCatalogAssetResolver(createCatalogMotion),
      onFrame() {
        const gl = engine.renderer.getContext();
        const pixels = new Uint8Array(canvas.width * canvas.height * 4);
        gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        last = { pixels, stats: engine.stats() };
      },
    });
    await engine.loaded;
    const register = engine.poseSharing.register;
    const capture = async (shared, kind, independent) => {
      const frames = engine.stats().frames;
      engine.poseSharing.register = shared ? register : () => {};
      engine.setPaused(true);
      for (let i = 0; i < 24; i++) {
        engine.setWander(i, false);
        engine.setMotionFrame(
          i,
          kind === 'reaction-neighbor' && i === 0 ? 'reaction' : kind === 'work' ? 'work' : 'idle',
          independent ? 0.5 + i * 0.173 : 0.5,
        );
        engine.states[i].poseSampleTime = undefined;
      }
      await new Promise((resolve, reject) => {
        const started = performance.now();
        const check = () => {
          if (last && last.stats.frames > frames) resolve();
          else if (performance.now() - started > 90000)
            reject(Error('Shared pose frame timed out'));
          else requestAnimationFrame(check);
        };
        check();
      });
      return last;
    };
    const cases = [];
    const compare = async (name, kind = 'idle', independent = false) => {
      const scalar = await capture(false, kind, independent);
      const shared = await capture(true, kind, independent);
      let changedPixels = 0,
        maxDifference = 0;
      for (let i = 0; i < scalar.pixels.length; i += 4) {
        let changed = false;
        for (let c = 0; c < 4; c++) {
          const difference = Math.abs(scalar.pixels[i + c] - shared.pixels[i + c]);
          changed ||= difference !== 0;
          maxDifference = Math.max(maxDifference, difference);
        }
        if (changed) changedPixels++;
      }
      cases.push({
        name,
        changedPixels,
        maxDifference,
        pixels: scalar.pixels.length / 4,
        directEvaluations: scalar.stats.poseEvaluations,
        sharedEvaluations: shared.stats.poseEvaluations,
        sharedCopies: shared.stats.sharedPoseCopies,
      });
    };
    try {
      await compare('same-clock-24');
      await compare('independent-clocks-24', 'idle', true);
      engine.setLook(0, 0.8, -0.3);
      engine.setColor(5, '#ffee00');
      await compare('independent-look-and-pigment');
      await compare('reaction-among-shared-idles', 'reaction-neighbor');
      await engine.prepareWork(0);
      await compare('work-falls-back-to-independent-sampling', 'work');
      const presets = [
        'blue_beret',
        'alfred',
        'purple_heart',
        'lime_frog',
        'coral_monocle',
        'gus',
        'blue_spectacles',
        'lime_headphones',
      ];
      await engine.setPresets(Array.from({ length: 24 }, (_, i) => presets[i % presets.length]));
      await compare('eight-authored-three-matching-clocks-each');
      const characters = [
        { preset: 'blue_beret', shape: 'heart', eyes: 'cyclops', accessory: 'crown' },
        { preset: 'lime_frog', shape: 'six_lobed_flower', eyes: 'todd', eyewear: 'monocle' },
        { preset: 'blue_spectacles', shape: 'cloud', eyes: 'oval', accessory: 'three_lobe' },
        { preset: 'alfred', shape: 'clippo', eyes: 'clippo', accessory: 'bow' },
      ];
      const recipes = characters.map((character) =>
        resolveCompleteEditorRecipe({
          character: resolveAvatarCharacter(character),
          reduced: false,
        }),
      );
      await engine.setPresets(
        Array.from({ length: 24 }, (_, i) => recipes[i % recipes.length].preset),
      );
      await compare('four-catalog-six-matching-clocks-each');
      await compare('catalog-independent-clocks', 'idle', true);
      return cases;
    } finally {
      engine.dispose();
    }
  });
  for (const result of report.cases) {
    assert.equal(result.changedPixels, 0, `${result.name}: changed pixel`);
    assert.equal(result.maxDifference, 0, `${result.name}: changed channel`);
    assert.equal(result.directEvaluations, 24, `${result.name}: scalar control did not execute`);
  }
  assert.equal(report.cases[0].sharedEvaluations, 1);
  assert.equal(report.cases[1].sharedEvaluations, 24);
  assert.equal(report.cases[1].sharedCopies, 0);
  assert.equal(report.cases[3].sharedEvaluations, 2);
  assert.equal(report.cases[4].sharedCopies, 0);
  assert.equal(report.cases[5].sharedEvaluations, 8);
  assert.equal(report.cases[6].sharedEvaluations, 4);
  assert.equal(report.cases[7].sharedCopies, 0);
  assert.deepEqual(report.errors, []);
} finally {
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
console.log(JSON.stringify(report));
