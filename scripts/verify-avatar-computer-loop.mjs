/** Full independently observed second cycle versus the packed repeating
 * controller, rendered through the same GPU pipeline. Not original PNG parity. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const { PNG } = require('pngjs');
const report = { cases: [], errors: [], forbidden: [], motionRequests: [] };
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.on('request', (r) => {
    if (/character-runtime|\.wasm(?:\?|$)/.test(r.url())) report.forbidden.push(r.url());
    if (r.resourceType() === 'fetch' && /packed-motion\/.*\.bin/.test(r.url()))
      report.motionRequests.push(r.url());
  });
  const size = 112;
  await page.setViewport({ width: size * 2, height: size, deviceScaleFactor: 1 });
  const url = 'http://localhost:6006/avatar-computer-loop-check.html';
  const cdp = await page.createCDPSession();
  cdp.on('Fetch.requestPaused', (e) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: e.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from('<!doctype html><html><body></body></html>').toString('base64'),
    }),
  );
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: url }] });
  await page.goto(url);
  await cdp.send('Fetch.disable');
  const presets = await page.evaluate(async (size) => {
    document.body.style.cssText = 'margin:0;background:#f5f5f2';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `display:block;width:${size * 2}px;height:${size}px`;
    document.body.append(canvas);
    const { AuthoredAvatarEngine } = await import(
      '/runtime/avatar/authored-engine.ts'
    );
    const { AuthoredMotionSampler } = await import('/runtime/avatar/motion.ts');
    const { AVATAR_PRESETS } = await import('/runtime/avatar/catalog.ts');
    window.Sampler = AuthoredMotionSampler;
    window.engine = new AuthoredAvatarEngine(canvas, { count: 2, size, poseOverrides: true });
    await engine.loaded;
    return [...AVATAR_PRESETS];
  }, size);
  const paint = async (fn, arg) => {
    const before = await page.evaluate(fn, arg);
    await page.waitForFunction((n) => engine.stats().frames > n, { timeout: 60000 }, before);
  };
  const capture = async () => PNG.sync.read(Buffer.from(await page.screenshot())).data;
  for (const preset of presets) {
    const motion = JSON.parse(
      await readFile(`.local/avatar-loop-assets/${preset}/computer-motion.json`),
    );
    await page.evaluate(
      async ({ preset, motion }) => {
        engine.setPaused(true);
        await engine.setPresets([preset]);
        engine.resetAppearance();
        engine.setMotionFrame(1, 'idle', 0);
        window.reference = new window.Sampler(motion.clip);
        window.referencePose = reference.createPose();
      },
      { preset, motion },
    );
    await page.waitForFunction(() => !engine.fitPending, { timeout: 60000 });
    for (const time of [7, 7 + 1 / 60, 8.3, 9.2, 10.75, 11.6, 12.9]) {
      await paint((time) => {
        const frames = engine.stats().frames;
        if (!engine.work(0, true)) throw Error('Continuous Computer unavailable');
        engine.paused = true;
        engine.time = engine.states[0].motion.started + time;
        engine.invalidate();
        return frames;
      }, time);
      const state = await page.evaluate(() => ({
        kind: engine.states[0].motion.kind,
        continuous: engine.states[0].motion.continuous,
        visible: engine.batches.filter(
          (b) => b.mesh.visible && b.part.source.activity === 'computer',
        ).length,
        contexts: engine.stats().contexts,
      }));
      assert.equal(state.kind, 'work');
      assert.equal(state.continuous, true);
      assert.equal(state.contexts, 1);
      assert(state.visible > 0);
      const actual = await capture();
      await paint((time) => {
        const frames = engine.stats().frames;
        reference.sample(time, referencePose);
        engine.setPose(0, referencePose);
        return frames;
      }, time);
      const expected = await capture();
      let maxChannel = 0,
        changed = 0,
        neighborChanged = 0;
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size * 2; x++) {
          const offset = (y * size * 2 + x) * 4;
          let pixel = 0;
          for (let c = 0; c < 4; c++)
            pixel = Math.max(pixel, Math.abs(actual[offset + c] - expected[offset + c]));
          if (x < size) {
            maxChannel = Math.max(maxChannel, pixel);
            if (pixel) changed++;
          } else if (pixel) neighborChanged++;
        }
      const result = { preset, time, maxChannel, changed, neighborChanged, ...state };
      report.cases.push(result);
      console.log(JSON.stringify(result));
      assert.equal(neighborChanged, 0);
      // Same-renderer reconstruction residuals, pinned individually; not a
      // tolerance for arbitrary regressions or original-renderer PNG parity.
      const residuals = {
        'blue_beret:11.6': [2, 5],
        'alfred:8.3': [2, 6],
        'blue_spectacles:11.6': [1, 3],
        'lime_headphones:10.75': [1, 1],
      };
      assert.deepEqual([maxChannel, changed], residuals[`${preset}:${time}`] ?? [0, 0]);
    }
    await page.evaluate(() => {
      engine.setPose(0, null);
      engine.states[0].motion.started = engine.time - 60;
      engine.setPaused(false);
    });
    const before = await page.evaluate(() => engine.stats().frames);
    await page.waitForFunction((n) => engine.stats().frames >= n + 3, { timeout: 60000 }, before);
    const moving = await page.evaluate(() => ({
      frames: engine.stats().frames,
      time: engine.time - engine.states[0].motion.started,
      kind: engine.states[0].motion.kind,
    }));
    assert(moving.time > 60);
    assert.equal(moving.kind, 'work');
    await page.evaluate(() => engine.setPaused(true));
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.forbidden, []);
  assert.equal(report.motionRequests.length, presets.length);
  assert.equal(new Set(report.motionRequests).size, presets.length);
  await page.evaluate(() => engine.dispose());
  assert.equal(await page.evaluate(() => engine.stats().contexts), 0);
} finally {
  await mkdir('.local/avatar-computer-loop-browser', { recursive: true });
  await writeFile(
    '.local/avatar-computer-loop-browser/report.json',
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
