/** Experimental presentation-only comparison. Does not modify the production pool.
 * Readbacks happen only in the held-frame fidelity gate, never in timing windows. */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const origin = process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007';
const output = process.env.AVATAR_PRESENTATION_OUTPUT || '.local/avatar-presentation';
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
  report.cases = await page.evaluate(
    async ({ fidelityOnly, duration, premultiplyAlpha, repremultiply }) => {
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
        let copyFence, afterFirstFence;
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
            if (i === 0 && copyFence) afterFirstFence = gl.clientWaitSync(copyFence, 0, 0);
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
              let bitmap = await createImageBitmap(stage, { premultiplyAlpha });
              if (repremultiply) {
                const first = bitmap;
                try {
                  bitmap = await createImageBitmap(first, { premultiplyAlpha: 'premultiply' });
                } finally {
                  first.close();
                }
              }
              try {
                copy(bitmap);
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
              resolve({ changedPixels: changed, maxChannelDifference: max, comparedPixels: total });
            } catch (error) {
              reject(error);
            }
          };
          engine.setMotionFrame(0, 'idle', 0.51);
        });
        // Fidelity readbacks can make Chromium demote a Canvas2D to CPU rendering.
        // Timing uses entirely new destinations that have NEVER been read back.
        for (let i = 0; i < count; i++) {
          const previous = canvases[i],
            fresh = document.createElement('canvas');
          fresh.width = previous.width;
          fresh.height = previous.height;
          fresh.style.cssText = previous.style.cssText;
          previous.replaceWith(fresh);
          canvases[i] = fresh;
          contexts[i] = fresh.getContext('2d');
        }
        const gl = engine.renderer.getContext();
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const record = {
          size,
          outputPixels,
          stageWidth: stage.width,
          stageHeight: stage.height,
          renderer: ext
            ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
            : gl.getParameter(gl.RENDERER),
          held,
          modes: [],
        };
        if (!fidelityOnly && held.changedPixels === 0) {
          for (const mode of ['direct', 'bitmap', 'direct-fence', 'bitmap', 'direct']) {
            let measured = false,
              stopped = false,
              sequence = 0,
              lastPresented = 0,
              revision = 0,
              deferred = false,
              deferredUrgent = false,
              maxPending = 0;
            let data = {
              rendered: 0,
              presented: 0,
              stale: 0,
              firstCopyMs: 0,
              remainingCopyMs: 0,
              bitmapCallMs: 0,
              bitmapLagMs: 0,
              fenceBeforeReady: 0,
              fenceAfterFirstReady: 0,
              fenceSamples: 0,
              started: 0,
              ended: 0,
            };
            const pending = new Set();
            const originalInvalidate = engine.invalidate.bind(engine);
            // Test-only hook into the existing scheduler; preserve continuous clocks,
            // queue at most two snapshots, and do not discard renderer work for load.
            engine.invalidate = (urgent) => {
              if (pending.size >= 2) {
                deferred = true;
                deferredUrgent ||= !!urgent;
              } else originalInvalidate(urgent);
            };
            const apply = (source, ticket, frameRevision) => {
              if (stopped || ticket <= lastPresented || frameRevision !== revision) {
                if (measured) data.stale++;
                return;
              }
              const times = copy(source);
              lastPresented = ticket;
              if (measured) {
                data.presented++;
                data.firstCopyMs += times[0];
                data.remainingCopyMs += times.slice(1).reduce((a, b) => a + b, 0);
              }
            };
            callback = () => {
              const ticket = ++sequence,
                frameRevision = revision;
              if (measured) data.rendered++;
              if (mode !== 'bitmap') {
                if (mode === 'direct-fence') {
                  copyFence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
                  gl.flush();
                  const status = gl.clientWaitSync(copyFence, 0, 0);
                  if (measured) {
                    data.fenceSamples++;
                    if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED)
                      data.fenceBeforeReady++;
                  }
                }
                apply(stage, ticket, frameRevision);
                if (copyFence) {
                  if (
                    measured &&
                    (afterFirstFence === gl.ALREADY_SIGNALED ||
                      afterFirstFence === gl.CONDITION_SATISFIED)
                  )
                    data.fenceAfterFirstReady++;
                  gl.deleteSync(copyFence);
                  copyFence = undefined;
                }
                return;
              }
              const requested = performance.now();
              let task;
              const initialBitmap = createImageBitmap(stage, { premultiplyAlpha });
              const bitmapPromise = repremultiply
                ? initialBitmap.then(async (first) => {
                    try {
                      return await createImageBitmap(first, { premultiplyAlpha: 'premultiply' });
                    } finally {
                      first.close();
                    }
                  })
                : initialBitmap;
              if (measured) data.bitmapCallMs += performance.now() - requested;
              task = bitmapPromise
                .then((bitmap) => {
                  try {
                    if (measured) data.bitmapLagMs += performance.now() - requested;
                    apply(bitmap, ticket, frameRevision);
                  } finally {
                    bitmap.close();
                  }
                })
                .finally(() => {
                  pending.delete(task);
                  if (deferred && pending.size < 2) {
                    const urgent = deferredUrgent;
                    deferred = deferredUrgent = false;
                    originalInvalidate(urgent);
                  }
                });
              pending.add(task);
              maxPending = Math.max(maxPending, pending.size);
            };
            for (let i = 0; i < count; i++) engine.idle(i);
            engine.setPaused(false);
            await pause(1500);
            data.started = performance.now();
            measured = true;
            await pause(duration);
            measured = false;
            data.ended = performance.now();
            engine.setPaused(true);
            await Promise.all(pending);
            stopped = true;
            revision++;
            callback = () => {};
            engine.invalidate = originalInvalidate;
            record.modes.push({
              mode,
              ...data,
              maxPending,
              fps: data.presented / ((data.ended - data.started) / 1000),
            });
          }
        }
        results.push(record);
        engine.dispose();
        stage.remove();
        layer.remove();
      }
      return results;
    },
    {
      fidelityOnly: process.env.AVATAR_PRESENTATION_FIDELITY_ONLY === '1',
      duration: Number(process.env.AVATAR_PRESENTATION_DURATION || 3000),
      premultiplyAlpha: process.env.AVATAR_BITMAP_PREMULTIPLY || 'default',
      repremultiply: process.env.AVATAR_BITMAP_REPREMULTIPLY === '1',
    },
  );
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
