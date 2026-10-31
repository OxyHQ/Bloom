/** The first delivered held pose must equal the same pose after fits are cached. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const origin = process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = { cases: [], errors: [] };
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 2 });
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*/avatar-first-frame.html' }] });
  cdp.on('Fetch.requestPaused', (e) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: e.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from('<!doctype html><body style="margin:0"></body>').toString('base64'),
    }),
  );
  await page.goto(`${origin}/avatar-first-frame.html`);
  await cdp.send('Fetch.disable');
  for (const [hostMode, empty] of process.env.AVATAR_FIRST_FRAME_DOM_ONLY === '1'
    ? [[false, false]]
    : [
        [false, false],
        [true, false],
        [false, true],
        [true, true],
      ]) {
    const result = await page.evaluate(
      async ({ hostMode, empty }) => {
        const { AuthoredAvatarEngine } = await import('/runtime/avatar/authored-engine.ts');
        let preset = 'blue_beret',
          resolveAsset;
        if (empty) {
          const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
          const { resolveCompleteEditorRecipe } = await import('/runtime/avatar/recipe.ts');
          const { createCatalogAssetResolver } = await import('/runtime/avatar/catalog-assets.ts');
          const { createCatalogMotion } = await import('/runtime/avatar/catalog-motion-factory.ts');
          preset = resolveCompleteEditorRecipe({
            character: resolveAvatarCharacter({ preset: 'blue_beret', eyes: 'none' }),
            previewPart: 'eyes',
            reduced: true,
          }).preset;
          resolveAsset = createCatalogAssetResolver(createCatalogMotion);
        }
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'width:128px;height:128px;display:block';
        document.body.append(canvas);
        let engine,
          armed = false;
        const snapshots = [];
        const capture = (gl, framebuffer, width, height) => {
          if (!armed) return;
          const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING);
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
          const pixels = new Uint8Array(width * height * 4);
          gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
          snapshots.push(pixels);
        };
        const gl = hostMode ? canvas.getContext('webgl2', { alpha: true, antialias: false }) : null;
        const host = hostMode
          ? {
              context: gl,
              getSize: () => ({ width: 128, height: 128, pixelRatio: 2 }),
              requestFrame: (cb) => requestAnimationFrame(cb),
              cancelFrame: (id) => cancelAnimationFrame(id),
              isHidden: () => false,
              onFrame: (o) => capture(gl, o.framebuffer, o.width, o.height),
            }
          : undefined;
        engine = new AuthoredAvatarEngine(hostMode ? null : canvas, {
          count: 1,
          size: 128,
          preset,
          resolveAsset,
          lazyWork: true,
          host,
          onFrame: hostMode
            ? undefined
            : () => {
                const gl = engine.renderer.getContext();
                capture(gl, null, gl.drawingBufferWidth, gl.drawingBufferHeight);
              },
        });
        await engine.loaded;
        engine.setPaused(true);
        engine.setWander(0, false);
        engine.setMotionFrame(0, 'idle', 0.5);
        armed = true;
        const wait = async (count) => {
          const start = performance.now();
          while (snapshots.length < count) {
            if (performance.now() - start > 20000)
              throw Error('Requested held frame was never delivered');
            await new Promise((r) => requestAnimationFrame(r));
          }
        };
        await wait(1);
        const first = snapshots[0];
        const previousCount = snapshots.length;
        engine.setMotionFrame(0, 'idle', 0.5);
        if (empty) engine.setColor(0, '#46719b');
        await wait(previousCount + 1);
        const stable = snapshots.at(-1);
        let changedPixels = 0,
          maxChannelDifference = 0;
        for (let i = 0; i < first.length; i += 4) {
          let d = 0;
          for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(first[i + c] - stable[i + c]));
          if (d) changedPixels++;
          maxChannelDifference = Math.max(maxChannelDifference, d);
        }
        const result = {
          host: hostMode ? 'injected' : 'DOM',
          empty,
          comparedPixels: first.length / 4,
          changedPixels,
          maxChannelDifference,
        };
        if (empty) {
          if (stable.some((value, index) => index % 4 === 3 && value !== 0))
            throw Error('Empty eyes preview unexpectedly paints pixels');
          const frames = engine.stats().frames;
          await new Promise((resolve) => setTimeout(resolve, 200));
          if (engine.stats().frames !== frames)
            throw Error('Empty paused preview does not become quiescent');
        }
        engine.dispose();
        canvas.remove();
        return result;
      },
      { hostMode, empty },
    );
    report.cases.push(result);
    console.log(JSON.stringify(result));
  }
  assert.deepEqual(report.errors, []);
  assert(
    report.cases.every((c) => c.changedPixels === 0),
    'Reference fit must never replace the first requested held pose',
  );
} finally {
  await mkdir('.local/avatar-first-frame', { recursive: true });
  await writeFile('.local/avatar-first-frame/report.json', `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
}
