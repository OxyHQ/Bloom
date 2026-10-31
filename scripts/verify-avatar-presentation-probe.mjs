/** Held pixels and deliberately reordered async completion; no performance claim. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { installAtlasBitmapProbe } from './fixtures/avatar/presentation/atlas-bitmap-probe.mjs';
const repremultiply = process.env.AVATAR_BITMAP_REPREMULTIPLY === '1';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 2 });
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*/presentation-probe.html' }] });
  cdp.on('Fetch.requestPaused', (event) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: event.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from('<!doctype html><body style="display:flex;margin:0"></body>').toString(
        'base64',
      ),
    }),
  );
  await page.goto(
    `${process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007'}/presentation-probe.html`,
  );
  await cdp.send('Fetch.disable');
  await page.evaluate(async () => {
    const runtime = await import('/runtime/avatar-runtime.ts');
    const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
    window.props = {
      character: resolveAvatarCharacter({ preset: 'blue_beret' }),
      reduced: false,
      paused: true,
    };
    window.canvases = [];
    window.controllers = [];
    window.ready = 0;
    for (let i = 0; i < 4; i++) {
      const canvas = document.createElement('canvas');
      canvas.style.width = canvas.style.height = '96px';
      document.body.append(canvas);
      canvases.push(canvas);
      controllers.push(
        await runtime.createAvatar(canvas, props, {
          onReady: () => ready++,
          onError: () => {
            throw Error('Avatar failed');
          },
        }),
      );
    }
    window.setColor = (color) => {
      props = {
        ...props,
        character: resolveAvatarCharacter({ preset: 'blue_beret', bodyColor: color }),
      };
      controllers.forEach((controller) => controller.update(props));
    };
    window.read = () =>
      canvases.map((canvas) =>
        Array.from(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data),
      );
  });
  await page.waitForFunction(() => ready === 4);
  const baseline = await page.evaluate(() => read());
  await page.evaluate(installAtlasBitmapProbe, {
    premultiplyAlpha: process.env.AVATAR_BITMAP_PREMULTIPLY || 'default',
    repremultiply,
  });
  await page.evaluate(() => __avatarPresentationProbe.setMode('bitmap'));
  await page.evaluate(() => controllers.forEach((controller) => controller.update({ ...props })));
  await page.waitForFunction(() => __avatarPresentationProbe.read().completed === 1);
  assert.deepEqual(
    await page.evaluate(() => read()),
    baseline,
    'Bitmap must preserve held RGBA exactly',
  );
  await page.evaluate(() => {
    const native = createImageBitmap;
    window.releases = [];
    window.bitmapClosedCount = 0;
    window.createImageBitmap = (...args) =>
      native(...args).then((bitmap) => {
        const close = bitmap.close.bind(bitmap);
        bitmap.close = () => {
          bitmapClosedCount++;
          close();
        };
        return args[0] instanceof ImageBitmap
          ? bitmap
          : new Promise((resolve) => releases.push(() => resolve(bitmap)));
      });
    setColor('#ff0000');
  });
  await page.waitForFunction(() => releases.length === 1);
  await page.evaluate(() => setColor('#00ff00'));
  await page.waitForFunction(() => releases.length === 2);
  await page.evaluate(() => setColor('#0000ff'));
  await page.waitForFunction(() => __avatarPresentationProbe.read().fallbackFrames === 1);
  const latest = await page.evaluate(() => read());
  await page.evaluate(async () => {
    releases[1]();
    releases[0]();
    await __avatarPresentationProbe.drain();
  });
  assert.deepEqual(
    await page.evaluate(() => read()),
    latest,
    'Late red/green bitmaps must not overwrite the newer direct blue frame',
  );
  const result = await page.evaluate(() => ({
    metrics: __avatarPresentationProbe.read(),
    closed: bitmapClosedCount,
    snapshot: canvases[0].toDataURL('image/png').startsWith('data:image/png;base64,'),
  }));
  assert.equal(result.metrics.maximumPending, 2);
  assert.equal(result.closed, repremultiply ? 4 : 2);
  assert.equal(result.snapshot, true);
  assert.equal(result.metrics.staleDestinations, 8);
  await page.evaluate(() => setColor('#ffff00'));
  await page.waitForFunction(() => releases.length === 3);
  await page.evaluate(() => __avatarPresentationProbe.dispose());
  await page.evaluate(() => setColor('#0000ff'));
  await new Promise((resolve) => setTimeout(resolve, 200));
  await page.evaluate(() => releases[2]());
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.deepEqual(
    await page.evaluate(() => read()),
    latest,
    'Disposed probe must not accept a late bitmap',
  );
  assert.equal(await page.evaluate(() => bitmapClosedCount), repremultiply ? 5 : 3);
  await page.evaluate(() => controllers.forEach((controller) => controller.dispose()));
  console.log(
    JSON.stringify({
      heldPixels: 4 * 192 * 192,
      lateUpdates: true,
      boundedQueue: 2,
      closedBitmaps: repremultiply ? 5 : 3,
      snapshot: true,
    }),
  );
} finally {
  await browser.close();
}
