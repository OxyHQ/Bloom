/** Experimental presentation-only comparison. Does not modify the production pool.
 * Readbacks happen only in the held-frame fidelity gate, never in timing windows. */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const origin = process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007';
const output = process.env.AVATAR_PRESENTATION_OUTPUT || '.local/avatar-bitmaprenderer-fidelity';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  protocolTimeout: 180000,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = { cases: [], errors: [] };
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 2 });
  page.on('pageerror', (error) => report.errors.push(error.message));
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*/avatar-presentation.html' }] });
  cdp.on('Fetch.requestPaused', (event) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: event.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from('<!doctype html><body style="margin:0"></body>').toString('base64'),
    }),
  );
  await page.goto(`${origin}/avatar-presentation.html`);
  await cdp.send('Fetch.disable');
  report.cases = await page.evaluate(async () => {
    const { AuthoredAvatarEngine } = await import('/runtime/avatar/authored-engine.ts');
    const { createCatalogAssetResolver } = await import('/runtime/avatar/catalog-assets.ts');
    const { createCatalogMotion } = await import('/runtime/avatar/catalog-motion-factory.ts');
    const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const results = [];
    const count = 24,
      columns = Math.ceil(Math.sqrt(count)),
      rows = Math.ceil(count / columns);
    for (const size of [64, 128]) {
      const stage = document.createElement('canvas');
      stage.style.cssText = `position:fixed;left:0;top:0;width:${columns * size}px;height:${rows * size}px;opacity:0;pointer-events:none`;
      document.body.append(stage);
      const outputWidth = size === 64 ? 64 : 112,
        outputPixels = outputWidth * 2;
      const layer = document.createElement('div');
      layer.style.cssText = 'display:flex;flex-wrap:wrap;width:800px';
      document.body.append(layer);
      const canvases = Array.from({ length: count }, () => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = outputPixels;
        canvas.style.cssText = `width:${outputWidth}px;height:${outputWidth}px`;
        layer.append(canvas);
        return canvas;
      });
      const contexts = canvases.map((canvas) => canvas.getContext('2d'));
      let callback = () => {},
        engine;
      engine = new AuthoredAvatarEngine(stage, {
        count,
        size,
        preset: 'blue_beret',
        lazyWork: true,
        resolveAsset: createCatalogAssetResolver(createCatalogMotion),
        onFrame: () => callback(),
      });
      await engine.loaded;
      engine.setPaused(true);
      // A single preset with distinct independent motion times isolates copying.
      for (let i = 0; i < count; i++) {
        engine.setWander(i, false);
        engine.setColor(i, '#' + (0x46719b + i * 10007).toString(16).padStart(6, '0'));
        engine.setMotionFrame(i, 'idle', 0.5 + i * 0.031);
      }
      await pause(250);

      const copy = (source) => {
        const tile = source.width / columns,
          times = [];
        for (let i = 0; i < count; i++) {
          const start = performance.now(),
            context = contexts[i];
          context.clearRect(0, 0, outputPixels, outputPixels);
          context.drawImage(
            source,
            (i % columns) * tile,
            Math.floor(i / columns) * tile,
            tile,
            tile,
            0,
            0,
            outputPixels,
            outputPixels,
          );
          times.push(performance.now() - start);
        }
        return times;
      };
      const pixels = () =>
        contexts.map((context) => context.getImageData(0, 0, outputPixels, outputPixels).data);
      const held = await new Promise((resolve, reject) => {
        callback = async () => {
          callback = () => {};
          try {
            copy(stage);
            const before = pixels();
            const scratch = new OffscreenCanvas(outputPixels, outputPixels),
              scratchContext = scratch.getContext('2d');
            const bitmap = await createImageBitmap(stage);
            try {
              for (let index = 0; index < count; index++) {
                const tile = stage.width / columns;
                const target = document.createElement('canvas');
                target.width = target.height = outputPixels;
                const bitmapContext = target.getContext('bitmaprenderer');
                if (!bitmapContext) throw Error('Bitmaprenderer unavailable');
                scratchContext.drawImage(
                  bitmap,
                  (index % columns) * tile,
                  Math.floor(index / columns) * tile,
                  tile,
                  tile,
                  0,
                  0,
                  outputPixels,
                  outputPixels,
                );
                const cropped = scratch.transferToImageBitmap();
                bitmapContext.transferFromImageBitmap(cropped);
                contexts[index].clearRect(0, 0, outputPixels, outputPixels);
                contexts[index].drawImage(target, 0, 0);
              }
            } finally {
              bitmap.close();
            }
            const after = pixels();
            let changed = 0,
              max = 0,
              total = 0;
            for (let j = 0; j < count; j++)
              for (let i = 0; i < before[j].length; i += 4) {
                let diff = 0;
                for (let c = 0; c < 4; c++)
                  diff = Math.max(diff, Math.abs(before[j][i + c] - after[j][i + c]));
                if (diff) changed++;
                max = Math.max(max, diff);
                total++;
              }
            resolve({
              changedPixels: changed,
              maxChannelDifference: max,
              comparedPixels: total,
              samples: Array.from(before[0])
                .flatMap((v, i) => (v !== after[0][i] ? [i, v, after[0][i]] : []))
                .slice(0, 90),
              beforeAlpha: before[0].filter((_, i) => i % 4 === 3).reduce((a, b) => a + b, 0),
              afterAlpha: after[0].filter((_, i) => i % 4 === 3).reduce((a, b) => a + b, 0),
            });
          } catch (error) {
            reject(error);
          }
        };
        engine.setMotionFrame(0, 'idle', 0.51);
      });
      const record = {
        size,
        outputPixels,
        stageWidth: stage.width,
        stageHeight: stage.height,
        held,
      };
      results.push(record);
      engine.dispose();
      stage.remove();
      layer.remove();
    }
    return results;
  });
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
  if (report.errors.length || report.cases.some((value) => value.held.changedPixels))
    throw Error('Scratch bitmaprenderer pixel fidelity failed');
} finally {
  await browser.close();
}
