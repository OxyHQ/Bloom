/** Side-by-side evidence at identical authored times; never uses recorded pictures as avatars. */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const output = process.env.AVATAR_CAPTURE_OUTPUT || '.local/avatar-efficiency-capture';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  protocolTimeout: 180000,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = [];
try {
  for (const [label, origin] of [
    ['before', process.env.AVATAR_BEFORE_URL || 'http://localhost:6006'],
    ['after', process.env.AVATAR_AFTER_URL || 'http://localhost:6007'],
  ]) {
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    await page.setViewport({ width: 1536, height: 224, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const client = await page.createCDPSession();
    await client.send('Fetch.enable', { patterns: [{ urlPattern: '*avatar-fixed-poses.html' }] });
    client.on('Fetch.requestPaused', (e) =>
      client.send('Fetch.fulfillRequest', {
        requestId: e.requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
        body: Buffer.from(
          '<!doctype html><body style="margin:0;background:#f5f5f2"></body>',
        ).toString('base64'),
      }),
    );
    await page.goto(`${origin}/avatar-fixed-poses.html`);
    await client.send('Fetch.disable');
    await page.evaluate(async () => {
      const { AuthoredAvatarEngine } = await import('/runtime/avatar/authored-engine.ts');
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'display:block;width:1536px;height:192px';
      document.body.append(canvas);
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
      window.engine = new AuthoredAvatarEngine(canvas, { count: 8, size: 192 });
      await engine.loaded;
      engine.setPaused(true);
      await engine.setPresets(presets);
      window.beforeFrames = engine.stats().frames;
      for (let i = 0; i < presets.length; i++) engine.setMotionFrame(i, 'idle', 0.5);
      const labels = document.createElement('div');
      labels.style.cssText = 'display:flex;font:12px sans-serif';
      labels.innerHTML = presets
        .map((x) => `<span style="width:192px;text-align:center">${x}</span>`)
        .join('');
      document.body.append(labels);
    });
    await page.waitForFunction(() => engine.stats().frames > beforeFrames, { timeout: 120000 });
    await page.screenshot({ path: `${output}/${label}.png` });
    const result = await page.evaluate(() => ({
      stats: engine.stats(),
      assets: performance
        .getEntriesByType('resource')
        .filter((e) => /\/assets\//.test(e.name))
        .map((e) => ({
          url: new URL(e.name).pathname,
          bytes: e.decodedBodySize,
          transferred: e.transferSize,
        })),
    }));
    report.push({ label, origin, ...result, errors });
    await page.evaluate(() => engine.dispose());
    await page.close();
    console.log(
      JSON.stringify({
        label,
        triangles: result.stats.triangles,
        resources: result.stats.resources,
        assetsBytes: result.assets.reduce((s, e) => s + e.bytes, 0),
        errors,
      }),
    );
  }
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
