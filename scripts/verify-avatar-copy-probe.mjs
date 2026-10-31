/** Held pixels and deliberately reordered async completion; no performance claim. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { installCopyProbe } from './fixtures/avatar/presentation/copy-probe.mjs';
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
  await page.evaluate(installCopyProbe);
  await page.evaluate(() => __avatarCopyProbe.setMode('copy'));
  await page.evaluate(() => controllers.forEach((controller) => controller.update({ ...props })));
  await page.waitForFunction(() => __avatarCopyProbe.read().draws >= 4);
  assert.deepEqual(
    await page.evaluate(() => read()),
    baseline,
    'Full transparent RGBA must match with copy',
  );
  for (const color of ['#ff0000', '#000000', '#ffffff', '#0000ff']) {
    await page.evaluate((color) => setColor(color), color);
    await new Promise((resolve) => setTimeout(resolve, 150));
    const copied = await page.evaluate(() => read());
    await page.evaluate(() => {
      __avatarCopyProbe.setMode('direct');
      controllers.forEach((controller) => controller.update({ ...props }));
    });
    await page.waitForFunction(() => __avatarCopyProbe.read().draws >= 4);
    assert.deepEqual(
      await page.evaluate(() => read()),
      copied,
      'Pigment/transparent edges must match',
    );
    await page.evaluate(() => __avatarCopyProbe.setMode('copy'));
  }
  console.log(
    JSON.stringify({
      exactPixels: 5 * 4 * 192 * 192,
      snapshot: await page.evaluate(() =>
        canvases[0].toDataURL('image/png').startsWith('data:image/png;base64,'),
      ),
    }),
  );
  await page.evaluate(() => {
    __avatarCopyProbe.dispose();
    controllers.forEach((controller) => controller.dispose());
  });
} finally {
  await browser.close();
}
