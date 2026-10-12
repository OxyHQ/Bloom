/** Painted color limits live in the engine, including direct API and preset paint. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const { PNG } = require('pngjs');
const output = '.local/avatar-body-pigment';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = { colors: [], errors: [] };
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 640, height: 320 });
  page.on('pageerror', (e) => report.errors.push(e.message));
  const url = 'http://localhost:6006/body-pigment-check.html',
    cdp = await page.createCDPSession();
  cdp.on('Fetch.requestPaused', (r) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: r.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from(
        '<html><head><link rel="icon" href="data:,"></head><body style="margin:0;background:#eeeeee"><canvas style="width:640px;height:320px"></canvas></body></html>',
      ).toString('base64'),
    }),
  );
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: url, requestStage: 'Request' }] });
  await page.goto(url);
  await cdp.send('Fetch.disable');
  await cdp.detach();
  await page.evaluate(async () => {
    const [{ AuthoredAvatarEngine }, { createCatalogAssetResolver }, { createCatalogMotion }] =
      await Promise.all([
        import('/runtime/avatar/authored-engine.ts'),
        import('/runtime/avatar/catalog-assets.ts'),
        import('/runtime/avatar/catalog-motion-factory.ts'),
      ]);
    window.engine = new AuthoredAvatarEngine(document.querySelector('canvas'), {
      count: 2,
      size: 320,
      resolveAsset: createCatalogAssetResolver(createCatalogMotion),
    });
    await engine.loaded;
    await engine.setPresets([
      'catalog:' +
        JSON.stringify({ shape: 'circle', eyes: 'none', eyewear: 'none', accessory: 'three_lobe' }),
    ]);
    engine.setPaused(true);
    window.paintInfo = () =>
      engine.stats().states.map((s) => {
        const a = engine.asset(s.preset),
          base = a.source.material.parts[0].fields.colorRoughness;
        const rgb = s.pigment.map((v, i) => v * base[i]);
        return { rgb, luminance: rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 };
      });
  });
  for (const hex of ['#000000', '#080019', '#0000ff', '#ffffff', '#4778ff']) {
    const n = await page.evaluate((hex) => {
      const n = engine.stats().frames;
      engine.setColor(0, hex);
      return n;
    }, hex);
    await page.waitForFunction((n) => engine.stats().frames > n && !engine.fitPending, {}, n);
    const paint = await page.evaluate(() => paintInfo());
    assert(paint[0].luminance >= 0.21 - 1e-6 && paint[0].luminance <= 0.68 + 1e-6);
    const screenshot = await page.screenshot({ path: `${output}/${hex.slice(1)}.png` });
    const png = PNG.sync.read(screenshot),
      center = (160 * png.width + 160) * 4;
    const rgb = [...png.data.slice(center, center + 3)];
    assert(Math.max(...rgb) > 75, 'Black must retain painted body detail');
    assert(Math.min(...rgb) < 250, 'White must retain painted body relief');
    report.colors.push({ hex, paint, center: rgb });
  }
  const reset = await page.evaluate(() => {
    engine.resetAppearance();
    return paintInfo();
  });
  assert(reset.every((p) => p.luminance >= 0.21 - 1e-6 && p.luminance <= 0.68 + 1e-6));
  assert(
    report.colors.every(
      (row) => JSON.stringify(row.paint[1]) === JSON.stringify(report.colors[0].paint[1]),
    ),
    'Neighbor unchanged',
  );
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report));
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
