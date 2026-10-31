/** Exact real-pool presentation/snapshot gate; no performance measurements. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { installBitmapRendererProbe } from './fixtures/avatar/presentation/bitmaprenderer-probe.mjs';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error(e));
  await page.setViewport({ width: 1000, height: 800, deviceScaleFactor: 2 });
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
  const arms = [];
  for (const mode of ['direct', 'bitmap']) {
    console.log('arm', mode);
    console.log('install', await page.evaluate(installBitmapRendererProbe, { mode }));
    await page.evaluate(async () => {
      const runtime = await import('/runtime/avatar-runtime.ts');
      const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
      console.log('loaded runtime');
      window.props = {
        character: resolveAvatarCharacter({ preset: 'blue_beret' }),
        reduced: false,
        paused: true,
      };
      window.canvases = [];
      window.controllers = [];
      window.ready = 0;
      window.errors = [];
      window.readyTransfers = [];
      for (const size of [64, 96, 112, 160]) {
        const canvas = document.createElement('canvas');
        canvas.style.width = canvas.style.height = size + 'px';
        document.body.append(canvas);
        canvases.push(canvas);
        controllers.push(
          await runtime.createAvatar(canvas, props, {
            onReady: () => {
              ready++;
              readyTransfers.push(__avatarBitmapRendererProbe.read().transfers);
            },
            onError: (e) => errors.push(String(e)),
          }),
        );
      }
      window.read = () =>
        canvases.map((canvas) => {
          const read = document.createElement('canvas');
          read.width = canvas.width;
          read.height = canvas.height;
          const context = read.getContext('2d');
          context.drawImage(canvas, 0, 0);
          return Array.from(context.getImageData(0, 0, read.width, read.height).data);
        });
    });
    await page
      .waitForFunction(() => ready === 4, { timeout: 60000 })
      .catch(async (error) => {
        console.error(
          await page.evaluate(() => ({
            ready,
            errors,
            metrics: __avatarBitmapRendererProbe.read(),
          })),
        );
        throw error;
      });
    const pixels = await page.evaluate(() => read());
    const before = await page.evaluate(() => __avatarBitmapRendererProbe.read());
    await new Promise((resolve) => setTimeout(resolve, 120));
    assert.equal(
      (await page.evaluate(() => __avatarBitmapRendererProbe.read())).transfers,
      before.transfers,
      'Paused canvases must retain content without extra transfer',
    );
    assert.deepEqual(await page.evaluate(() => read()), pixels);
    const snapshot = await page.evaluate(async () => {
      const image = new Image();
      image.src = canvases[2].toDataURL('image/png');
      await image.decode();
      const target = document.createElement('canvas');
      target.width = image.width;
      target.height = image.height;
      const context = target.getContext('2d');
      context.drawImage(image, 0, 0);
      return Array.from(context.getImageData(0, 0, image.width, image.height).data);
    });
    assert.deepEqual(snapshot, pixels[2], 'Actual PNG decode must preserve all RGBA');
    const diagnostics = await page.evaluate(() => ({
      metrics: __avatarBitmapRendererProbe.read(),
      readyTransfers,
      errors,
    }));
    assert.deepEqual(diagnostics.errors, []);
    if (mode === 'bitmap') {
      assert.equal(diagnostics.metrics.supported, true);
      assert.equal(diagnostics.metrics.fallbacks, 0);
      assert(
        diagnostics.readyTransfers.every((count) => count > 0),
        'Ready must follow real transfer',
      );
    }
    arms.push(pixels);
    await page.evaluate(() => {
      controllers.forEach((controller) => controller.dispose());
      canvases.forEach((canvas) => canvas.remove());
      __avatarBitmapRendererProbe.dispose();
    });
  }
  assert.deepEqual(arms[1], arms[0], 'All real-pool output dimensions and RGBA must match');
  console.log(
    JSON.stringify({
      exactPixels: arms[0].reduce((total, rgba) => total + rgba.length / 4, 0),
      snapshotPNG: true,
      pausedRetention: true,
      onReadyAfterTransfer: true,
      pending: 0,
    }),
  );
} finally {
  await browser.close();
}
