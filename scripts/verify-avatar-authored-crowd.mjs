/** Real-browser crowd/resource gate. Record actual WebGL renderer; never infer hardware from host specs. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const { PNG } = require('pngjs');
const output = process.env.AVATAR_CROWD_OUTPUT || '.local/avatar-authored-crowd';
await mkdir(output, { recursive: true });
const frameRateLimit = process.env.AVATAR_FRAME_RATE
  ? Number(process.env.AVATAR_FRAME_RATE)
  : Infinity;
const mixed = process.env.AVATAR_CROWD_MIXED === '1';
const activity = process.env.AVATAR_CROWD_ACTIVITY || 'idle';
assert(['idle', 'work'].includes(activity));
const sampleMilliseconds = activity === 'work' ? 2000 : 5000;
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
const partCounts = await Promise.all(
  presets.map(async (preset) => {
    const material = JSON.parse(
      await readFile(
        `runtime/avatar/assets/${preset}/${activity === 'work' ? 'computer-' : ''}material.json`,
        'utf8',
      ),
    );
    return material.parts.reduce(
      (sum, part) => sum + 1 + Number(part.depthWrite !== false) + Number(part.fur),
      0,
    );
  }),
);
const report = {
  frameRateLimit: frameRateLimit === Infinity ? null : frameRateLimit,
  scenario: `${mixed ? 'Eight presets' : 'Blue preset'} using recovered original ${activity} animation`,
  caveat:
    'Original small-avatar meshes/materials. Work samples the first two seconds of simultaneous Computer episodes; idle samples five seconds. This does not prove complete interaction parity, laptop power or thermal behavior. Consult webglRenderer and GPU evidence for the actual backend. Draw calls include depth, AO, color and presentation.',
  activity,
  requestedSampleMilliseconds: sampleMilliseconds,
  cssPixelsPerAvatar: 112,
  cases: [],
  nonRenderingErrors: [],
};
const save = () => writeFile(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
const browser = process.env.AVATAR_BROWSER_URL
  ? await puppeteer.connect({ browserURL: process.env.AVATAR_BROWSER_URL, protocolTimeout: 180000 })
  : await puppeteer.launch({
      executablePath: process.env.CHROME_PATH,
      headless: true,
      protocolTimeout: 180000,
      args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
    });
try {
  report.gpu = (
    await (await browser.target().createCDPSession()).send('SystemInfo.getInfo')
  ).gpu.devices;
  const counts = (process.env.AVATAR_CROWD_COUNTS || '1,24,48,100').split(',').map(Number);
  assert(counts.every((n) => Number.isInteger(n) && n >= 1 && n <= 200));
  for (const count of counts) {
    const page = await browser.newPage();
    const errors = [],
      forbiddenRequests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const url = message.location().url;
      if (url && new URL(url).pathname === '/favicon.ico' && message.text().includes('404')) {
        report.nonRenderingErrors.push({ url, message: message.text() });
        return;
      }
      errors.push(`${message.text()} (${url || 'unknown source'})`);
    });
    page.on('request', (request) => {
      if (/bloom-character|orbit-characters|preparation-worker|\.wasm(?:\?|$)/.test(request.url()))
        forbiddenRequests.push(request.url());
    });
    await page.evaluateOnNewDocument(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      const seen = new WeakSet();
      window.contextAudit = { created: 0, lost: 0 };
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        const context = getContext.call(this, type, ...args);
        if (
          context &&
          ['webgl', 'webgl2', 'experimental-webgl'].includes(type) &&
          !seen.has(context)
        ) {
          seen.add(context);
          window.contextAudit.created++;
          this.addEventListener(
            'webglcontextlost',
            () => {
              window.contextAudit.lost++;
            },
            { once: true },
          );
        }
        return context;
      };
    });
    const height = Math.ceil(count / 10) * 112;
    await page.setViewport({
      width: 1152,
      height: height + 32,
      deviceScaleFactor: 1,
    });
    await page.goto(`${process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6006'}/iframe.html`);
    await page.bringToFront();
    const started = Date.now();
    await page.evaluate(
      async ({ count, height, mixed, presets, frameRateLimit }) => {
        document.body.replaceChildren();
        document.body.style.cssText = 'margin:16px;background:#f5f5f2;overflow:hidden';
        const canvas = document.createElement('canvas');
        canvas.style.cssText = `width:1120px;height:${height}px;display:block`;
        document.body.append(canvas);
        const { AuthoredAvatarEngine } = await import('/runtime/avatar/authored-engine.ts');
        const engine = (window.authoredEngine = new AuthoredAvatarEngine(canvas, {
          count,
          size: 112,
          maxFrameRate: frameRateLimit ?? Infinity,
        }));
        await engine.loaded;
        if (mixed)
          await engine.setPresets(
            Array.from({ length: count }, (_, i) => presets[i % presets.length]),
          );
        for (let i = 0; i < count; i++)
          engine.setColor(i, `#${(0x46719b + i * 10007).toString(16).padStart(6, '0')}`);
        engine.setPaused(false);
      },
      {
        count,
        height,
        mixed,
        presets,
        frameRateLimit: Number.isFinite(frameRateLimit) ? frameRateLimit : null,
      },
    );
    await page.waitForFunction(() => window.authoredEngine?.stats().frames >= 3, {
      timeout: 120000,
    });
    report.webglRenderer = await page.evaluate(() => {
      const gl = window.authoredEngine.renderer.getContext();
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext
        ? {
            vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),
            renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),
          }
        : { renderer: gl.getParameter(gl.RENDERER) };
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const readyMilliseconds = Date.now() - started;
    const client = await page.createCDPSession();
    await client.send('Performance.enable');
    const metrics = async () =>
      Object.fromEntries(
        (await client.send('Performance.getMetrics')).metrics.map(({ name, value }) => [
          name,
          value,
        ]),
      );
    const beforeMetrics = await metrics();
    if (activity === 'work')
      await page.evaluate(() => {
        const engine = window.authoredEngine;
        for (let i = 0; i < engine.stats().count; i++) {
          if (!engine.work(i)) throw Error(`Missing Computer for avatar ${i}`);
        }
      });
    const before = await page.evaluate(() => ({
      timestamp: performance.now(),
      stats: window.authoredEngine.stats(),
    }));
    await new Promise((resolve) => setTimeout(resolve, sampleMilliseconds));
    const after = await page.evaluate(() => ({
      timestamp: performance.now(),
      stats: window.authoredEngine.stats(),
      contexts: window.contextAudit,
    }));
    const afterMetrics = await metrics();
    assert(after.stats.frames > before.stats.frames, 'Render loop advances');
    assert.equal(after.stats.states.length, count);
    assert.equal(
      new Set(after.stats.states.map((state) => state.phase)).size,
      count,
      'Every avatar has a distinct phase',
    );
    assert.equal(
      new Set(after.stats.states.map((state) => JSON.stringify(state.pigment))).size,
      count,
      'Every avatar has a distinct pigment',
    );
    assert.equal(after.stats.contexts, 1);
    assert.equal(after.contexts.created, 1, 'One actual WebGL context');
    assert.equal(after.contexts.lost, 0);
    console.log(
      JSON.stringify({
        phase: 'measurement',
        count,
        elapsed: after.timestamp - before.timestamp,
        before: before.stats.states[0],
        after: after.stats.states[0],
        frames: after.stats.frames - before.stats.frames,
        drawCalls: after.stats.drawCalls,
      }),
    );
    assert.equal(
      after.stats.drawCalls,
      3 +
        (mixed
          ? partCounts.slice(0, Math.min(count, presets.length)).reduce((a, b) => a + b, 0)
          : partCounts[0]),
      'Draw calls grow with unique part families, not copies',
    );
    assert(
      after.stats.height >= after.stats.requiredHeight,
      'Canvas fits every avatar at fixed CSS size',
    );
    assert.equal(after.stats.pixelRatio, 1);
    assert.deepEqual(forbiddenRequests, [], 'No recovered runtime/WASM requests');
    assert.deepEqual(errors, [], 'No browser or shader errors');
    await page.evaluate(async () => {
      const engine = window.authoredEngine;
      const states = engine.stats().states;
      engine.setPaused(true);
      for (const state of states)
        engine.setMotionFrame(state.index, state.motion, state.motionTime);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const paused = await page.evaluate(() => window.authoredEngine.stats());
    const firstScreenshot = Buffer.from(
      await page.screenshot({ path: `${output}/crowd-${count}.png` }),
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
    const secondScreenshot = Buffer.from(await page.screenshot());
    const firstPixels = PNG.sync.read(firstScreenshot),
      secondPixels = PNG.sync.read(secondScreenshot);
    assert(secondPixels.data.equals(firstPixels.data), 'Paused canvas pixels remain unchanged');
    assert.equal(
      await page.evaluate(() => window.authoredEngine.stats().frames),
      paused.frames,
      'Pause stops submissions',
    );
    const inkPerAvatar = [];
    const cols = Math.min(count, 10);
    for (let i = 0; i < count; i++) {
      const left = 16 + (1120 - cols * 112) / 2 + (i % 10) * 112;
      const top = 16 + Math.floor(i / 10) * 112;
      let ink = 0;
      for (let y = top; y < top + 112; y++)
        for (let x = left; x < left + 112; x++) {
          const at = (y * firstPixels.width + x) * 4;
          if (
            Math.max(
              Math.abs(firstPixels.data[at] - 245),
              Math.abs(firstPixels.data[at + 1] - 245),
              Math.abs(firstPixels.data[at + 2] - 242),
            ) > 8
          )
            ink++;
        }
      assert(ink > 100, `Avatar ${i} is visibly painted, not blank`);
      inkPerAvatar.push(ink);
    }
    await page.evaluate(() => window.authoredEngine.dispose());
    await page.waitForFunction(() => window.contextAudit.lost === 1, {
      timeout: 10000,
    });
    const cleanup = await page.evaluate(() => ({
      stats: window.authoredEngine.stats(),
      contexts: window.contextAudit,
    }));
    assert.equal(cleanup.stats.contexts, 0);
    assert.equal(cleanup.contexts.created - cleanup.contexts.lost, 0, 'Actual context released');
    assert.equal(cleanup.stats.resources.geometries, 0);
    assert.equal(cleanup.stats.resources.textures, 0);
    assert.equal(cleanup.stats.resources.programs, 0);
    assert.deepEqual(errors, []);
    const elapsedSeconds = (after.timestamp - before.timestamp) / 1000;
    const result = {
      count,
      readyMilliseconds,
      sampleMilliseconds: elapsedSeconds * 1000,
      renderedFrames: after.stats.frames - before.stats.frames,
      measuredFramesPerSecond: (after.stats.frames - before.stats.frames) / elapsedSeconds,
      engineReportedFramesPerSecond: after.stats.observedFrameRate,
      mainThreadSeconds: afterMetrics.TaskDuration - beforeMetrics.TaskDuration,
      cpuSampleMilliseconds: (afterMetrics.Timestamp - beforeMetrics.Timestamp) * 1000,
      drawCalls: after.stats.drawCalls,
      triangles: after.stats.triangles,
      resources: after.stats.resources,
      canvas: {
        width: after.stats.width,
        height: after.stats.height,
        pixelRatio: after.stats.pixelRatio,
      },
      contexts: after.contexts,
      uniquePigments: count,
      uniquePhases: count,
      inkPerAvatar,
      pauseFramesAndPixelsStable: true,
      actualContextReleased: true,
      states: after.stats.states,
    };
    report.cases.push(result);
    await save();
    console.log(
      JSON.stringify({
        count,
        fps: result.measuredFramesPerSecond,
        sampleMilliseconds: result.sampleMilliseconds,
        drawCalls: result.drawCalls,
        resources: result.resources,
      }),
    );
    await page.close();
  }
} catch (error) {
  report.failure = String(error.stack || error);
  await save();
  throw error;
} finally {
  await browser.close();
}
