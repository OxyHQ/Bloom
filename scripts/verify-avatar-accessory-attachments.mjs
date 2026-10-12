/** Render coat-colored Tuft and fitted headwear on different bodies. */
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
const output = '.local/avatar-accessory-attachments';
await mkdir(output, { recursive: true });
const report = { errors: [], colors: [] };
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1020, height: 800 });
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.on('console', (m) => {
    if (/GL_INVALID|GL_OUT_OF_MEMORY/.test(m.text())) report.errors.push(m.text());
  });
  await page.setRequestInterception(true);
  page.on('request', (r) =>
    r.url().endsWith('/attachment-check.html')
      ? r.respond({
          contentType: 'text/html',
          body: '<!doctype html><meta charset="utf-8"><body style="background:#f8f3f0;font:16px sans-serif"><p>Todd · Circle · Heart — Crown / Tuft / Beanie, Bow, Headphones / Hexagon Tuft</p><canvas style="width:960px;height:720px"></canvas></body>',
        })
      : r.continue(),
  );
  await page.goto('http://localhost:6006/attachment-check.html');
  await page.evaluate(async () => {
    const { AuthoredAvatarEngine } = await import('/runtime/avatar/authored-engine.ts');
    const { createCatalogAssetResolver } = await import('/runtime/avatar/catalog-assets.ts');
    const { createCatalogMotion } = await import('/runtime/avatar/catalog-motion-factory.ts');
    const recipes = ['crown', 'three_lobe'].flatMap((accessory) =>
      ['rounded_head_two_ears', 'circle', 'heart'].map((shape) => ({
        shape,
        eyes: 'todd',
        eyewear: 'none',
        accessory,
      })),
    );
    recipes.push(
      ...['beanie', 'bow', 'headphones'].map((accessory) => ({
        shape: 'rounded_head_two_ears',
        eyes: 'todd',
        eyewear: 'none',
        accessory,
      })),
    );
    recipes.push({ shape: 'rounded_cube', eyes: 'todd', eyewear: 'none', accessory: 'three_lobe' });
    window.engine = new AuthoredAvatarEngine(document.querySelector('canvas'), {
      count: recipes.length,
      size: 240,
      resolveAsset: createCatalogAssetResolver(createCatalogMotion),
    });
    await engine.loaded;
    await engine.setPresets(recipes.map((r) => 'catalog:' + JSON.stringify(r)));
    window.frames = async () => {
      for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    };
    for (let i = 0; i < engine.count; i++) engine.idle(i);
    await frames();
  });
  for (const color of ['#65be28', '#ff632b', '#9756ed']) {
    const evidence = await page.evaluate(async (color) => {
      for (let i = 0; i < engine.count; i++) engine.setColor(i, color);
      await frames();
      const results = [];
      for (const i of [3, 4, 5, 9]) {
        const state = engine.states[i],
          asset = engine.assets.get(`${state.preset}:${engine.detail}`);
        const body = asset.parts.find((p) => p.source.id === 0 && !p.source.fur);
        const coat = Array.from(body.motionTexture.image.data.slice(20, 23));
        const expected = coat.slice(0, 3).map((v, k) => v * state.color.toArray()[k]);
        for (const part of asset.parts.filter((p) => p.source.attachment === 'three_lobe')) {
          const attr = part.source.geometry.getAttribute('instancePigment');
          const pigment = [attr.getX(0), attr.getY(0), attr.getZ(0)];
          const painted = Array.from(part.motionTexture.image.data.slice(20, 23)).map(
            (v, k) => v * pigment[k],
          );
          results.push({ index: i, fur: part.source.fur, expected, painted });
        }
      }
      return results;
    }, color);
    assert.equal(evidence.length, 8, 'Solid Tuft and fur both receive coat pigment');
    for (const row of evidence)
      row.expected.forEach((v, k) => assert(Math.abs(v - row.painted[k]) < 2e-7));
    report.colors.push({ color, evidence });
    await page.screenshot({ path: `${output}/${color.slice(1)}.png` });
  }
  await page.evaluate(async () => {
    for (let i = 0; i < engine.count; i++) engine.work(i);
    await frames();
  });
  await page.screenshot({ path: `${output}/computer.png` });
  const canonical = await page.evaluate(async () => {
    engine.setCount(3);
    await engine.setPresets(['blue_spectacles', 'blue_spectacles', 'blue_spectacles']);
    for (let i = 0; i < 3; i++) {
      engine.idle(i);
      if (i) engine.setColor(i, ['unused', '#65be28', '#ff632b'][i]);
    }
    await frames();
    return engine.states.slice(0, 3).flatMap((state, i) => {
      const asset = engine.assets.get(`${state.preset}:${engine.detail}`);
      const body = asset.parts.find((p) => p.source.id === 0 && !p.source.fur);
      const expected = body.source.fields.colorRoughness
        .slice(0, 3)
        .map((v, k) => v * state.color.toArray()[k]);
      return asset.parts
        .filter((p) => p.source.attachment === 'three_lobe')
        .map((p) => {
          const pigment = p.source.geometry.getAttribute('instancePigment');
          const rgb = [pigment.getX(i), pigment.getY(i), pigment.getZ(i)];
          return {
            index: i,
            fur: p.source.fur,
            expected,
            painted: p.source.fields.colorRoughness.slice(0, 3).map((v, k) => v * rgb[k]),
          };
        });
    });
  });
  assert.equal(canonical.length, 6);
  for (const row of canonical)
    row.expected.forEach((v, k) => assert(Math.abs(v - row.painted[k]) < 2e-7));
  report.canonical = canonical;
  await page.screenshot({ path: `${output}/canonical-tuft.png` });
  await page.evaluate(() => engine.dispose());
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify({ colors: report.colors.length, avatars: 10, errors: report.errors }));
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
