/** Resolve real catalog assets and inspect material RGB across every action. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(
  process.env.BLOOM_PUPPETEER_MODULE ||
    '/home/nate/Oxy/Homiio/node_modules/puppeteer-core',
);
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ||
    '/home/nate/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
try {
  await mkdir('.local/avatar-catalog-special-eyes', { recursive: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', {
    patterns: [
      { urlPattern: '*/avatar-pigment-proof.html', requestStage: 'Request' },
    ],
  });
  cdp.on('Fetch.requestPaused', (event) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: event.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from(
        '<!doctype html><title>Catalog pigment proof</title>',
      ).toString('base64'),
    }),
  );
  await page.goto(
    `${process.env.STORYBOOK_URL || 'http://localhost:6006'}/avatar-pigment-proof.html`,
  );
  await cdp.send('Fetch.disable');
  const rows = await page.evaluate(async () => {
    const { createCatalogAssetResolver } = await import(
      '/runtime/avatar/catalog-assets.ts'
    );
    const { createCatalogMotion } = await import(
      '/runtime/avatar/catalog-motion-factory.ts'
    );
    const { resolveCompleteEditorRecipe } = await import(
      '/runtime/avatar/recipe.ts'
    );
    const { DEFAULT_CONFIG } = await import('/src/agent-avatar/model.ts');
    const { legacyRecipe } = await import('/src/agent-avatar/legacy-recipe.ts');
    const resolve = createCatalogAssetResolver(createCatalogMotion),
      rows = [];
    for (const detail of ['low', 'high']) {
      for (const eyes of ['none', 'alien']) {
        const config = {
          ...DEFAULT_CONFIG,
          family: 'alien',
          face: eyes !== 'none',
        };
        const recipe = resolveCompleteEditorRecipe({
          config,
          legacy: legacyRecipe(config),
          reduced: false,
        });
        const asset = await resolve(recipe.preset, detail);
        const eyeParts = asset.source.parts.filter(
          (p) => p.label === 'Alien almond eye',
        );
        if (eyeParts.length !== (eyes === 'alien' ? 2 : 0))
          throw Error('Wrong Alien eye count');
        if (
          eyes === 'none' &&
          asset.source.parts.some((p) => p.category === 'eyes')
        )
          throw Error('Faceless recipe still has eyes');
        for (const kind of ['idle', 'reaction', 'work']) {
          const sampler = asset.samplers[kind],
            pose = sampler.createPose();
          for (const fraction of [0, 0.3, 0.8, 1]) {
            sampler.sample(sampler.clip.duration * fraction, pose);
            if (
              pose.some((p) =>
                [
                  ...p.world.elements,
                  ...p.normalMatrix.elements,
                  ...Object.values(p.fields).flat(),
                ].some((x) => !Number.isFinite(x)),
              )
            )
              throw Error('Non-finite animation');
            for (const eye of eyeParts) {
              const actual = pose.find((p) => p.id === `mesh:${eye.id}`);
              if (
                !actual.fields.colorRoughness.every(
                  (v, k) => v === eye.fields.colorRoughness[k],
                )
              )
                throw Error('Alien material overwritten by motion');
            }
          }
          rows.push({ detail, eyes, kind, parts: pose.length });
        }
        for (const part of asset.source.parts) part.geometry.dispose();
      }
      for (const shape of ['circle', 'clippo']) {
        const assets = [];
        for (const spacing of [0.7, 1.3]) {
          const key = `catalog:${JSON.stringify({ shape, eyes: shape === 'clippo' ? 'clippo' : 'oval', eyewear: 'none', accessory: 'none', eyeSpacing: spacing })}`;
          assets.push(await resolve(key, detail));
        }
        const gap = (asset) => {
          const parts = asset.source.parts.filter((p) => p.category === 'eyes');
          const xs = parts.map((p) => (p.bounds.min[0] + p.bounds.max[0]) / 2);
          return Math.max(...xs) - Math.min(...xs);
        };
        if (!(gap(assets[1]) > gap(assets[0])))
          throw Error('Eye spacing was ignored');
        rows.push({ detail, shape, gaps: assets.map(gap) });
        for (const asset of assets)
          for (const part of asset.source.parts) part.geometry.dispose();
      }
    }
    return rows;
  });
  await page.setViewport({ width: 960, height: 340, deviceScaleFactor: 1 });
  const render = await page.evaluate(async () => {
    const { AuthoredAvatarEngine } = await import(
      '/runtime/avatar/authored-engine.ts'
    );
    const { createCatalogAssetResolver } = await import(
      '/runtime/avatar/catalog-assets.ts'
    );
    const { createCatalogMotion } = await import(
      '/runtime/avatar/catalog-motion-factory.ts'
    );
    const { resolveCompleteEditorRecipe } = await import(
      '/runtime/avatar/recipe.ts'
    );
    const { ALIEN_CONFIG } = await import('/src/agent-avatar/model.ts');
    const { legacyRecipe } = await import('/src/agent-avatar/legacy-recipe.ts');
    document.body.style.cssText = 'margin:0;display:flex;background:#d9ddd8';
    const result = [];
    window.specialEyeEngines = [];
    for (const [name, changes] of [
      ['neutral', {}],
      ['happy', { eyes: 'happy', expression: 100 }],
      ['none', { face: false }],
    ]) {
      const config = { ...ALIEN_CONFIG, ...changes };
      const recipe = resolveCompleteEditorRecipe({
        config,
        reduced: false,
        legacy: legacyRecipe(config),
      });
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'width:320px;height:320px';
      document.body.append(canvas);
      const copy = document.createElement('canvas');
      const ctx = copy.getContext('2d');
      const engine = new AuthoredAvatarEngine(canvas, {
        count: 1,
        size: 320,
        preset: recipe.preset,
        resolveAsset: createCatalogAssetResolver(createCatalogMotion),
        onFrame: () => {
          copy.width = canvas.width;
          copy.height = canvas.height;
          ctx.drawImage(canvas, 0, 0);
        },
      });
      await engine.loaded;
      engine.setPaused(true);
      if (recipe.color) engine.setColor(0, recipe.color);
      await new Promise((r) => setTimeout(r, 300));
      const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
      let painted = 0,
        dark = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] > 100) painted++;
        if (
          pixels[i + 3] > 100 &&
          Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) < 50
        )
          dark++;
      }
      result.push({
        name,
        painted,
        dark,
        glError: canvas.getContext('webgl2').getError(),
      });
      window.specialEyeEngines.push(engine);
    }
    return result;
  });
  await page.screenshot({
    path: '.local/avatar-catalog-special-eyes/preview.png',
  });
  await page.evaluate(() =>
    window.specialEyeEngines.forEach((engine) => engine.dispose()),
  );
  for (const row of render) {
    assert.ok(row.painted > 1000, JSON.stringify(row));
    assert.equal(row.glError, 0);
  }
  assert.ok(
    render[0].dark > render[2].dark + 50,
    'Alien almond eyes must paint visible dark geometry',
  );
  assert.equal(rows.length, 16);
  assert.deepEqual(errors, []);
  await mkdir('.local/avatar-catalog-special-eyes', { recursive: true });
  await writeFile(
    '.local/avatar-catalog-special-eyes/report.json',
    JSON.stringify({ rows, render, errors }, null, 2),
  );
  console.log(`PASS ${rows.length} special-eye and spacing asset cases`);
} finally {
  await browser.close();
}
