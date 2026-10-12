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
try {
  const page = await browser.newPage(),
    errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.setViewport({ width: 640, height: 480, deviceScaleFactor: 1 });
  await page.goto('http://localhost:6006/iframe.html');
  await page.evaluate(async () => {
    document.body.replaceChildren();
    document.body.style.cssText = 'margin:0;background:#f5f5f2';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:320px;height:320px';
    document.body.append(canvas);
    const { AuthoredAvatarEngine } = await import(
      '/runtime/avatar/authored-engine.ts'
    );
    window.engine = new AuthoredAvatarEngine(canvas);
    await window.engine.loaded;
    window.engine.setPaused(false);
  });
  await page.waitForFunction(() => window.engine.stats().frames > 4);
  await page.evaluate(
    () => (document.querySelector('canvas').style.transform = 'translateY(2000px)'),
  );
  await page.waitForFunction(() => window.engine.stats().suspended);
  const hidden = await page.evaluate(() => window.engine.stats().frames);
  await new Promise((r) => setTimeout(r, 400));
  assert.equal(
    await page.evaluate(() => window.engine.stats().frames),
    hidden,
    'offscreen stops actual frame submissions',
  );
  await page.evaluate(() => (document.querySelector('canvas').style.transform = ''));
  await page.waitForFunction((hidden) => window.engine.stats().frames > hidden + 4, {}, hidden);
  await page.evaluate(() => window.engine.setPaused(true));
  const settle = () =>
    page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await settle();
  const canvas = await page.$('canvas'),
    before = Buffer.from(await canvas.screenshot());
  const resources = await page.evaluate(() => window.engine.stats().resources);
  await page.evaluate(() => {
    const gl = document.querySelector('canvas').getContext('webgl2');
    window.loss = gl.getExtension('WEBGL_lose_context');
    window.loss.loseContext();
  });
  await page.waitForFunction(() => window.engine.stats().suspended);
  await page.evaluate(() => window.loss.restoreContext());
  await page.waitForFunction(() => !window.engine.stats().suspended);
  await settle();
  assert(
    Buffer.from(await canvas.screenshot()).equals(before),
    'restored context paints identical fixed pose',
  );
  assert.deepEqual(
    await page.evaluate(() => window.engine.stats().resources),
    resources,
    'restore recreates exactly the live resource set',
  );
  await page.evaluate(() => {
    window.engine.dispose();
    window.engine.dispose();
  });
  assert.deepEqual(await page.evaluate(() => window.engine.stats().resources), {
    geometries: 0,
    textures: 0,
    programs: 0,
  });
  assert.deepEqual(errors, []);
  await mkdir('.local/avatar-lifecycle', { recursive: true });
  await writeFile(
    '.local/avatar-lifecycle/report.json',
    JSON.stringify(
      {
        offscreenFramesStable: true,
        resume: true,
        contextRestoredPixelsIdentical: true,
        resources,
        disposal: true,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    'PASS: offscreen suspension/resume, context loss/restore with identical pixels, idempotent disposal.',
  );
} finally {
  await browser.close();
}
