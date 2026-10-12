/** Render the actual controller boundary, repeated episodes, and resumed RAF.
 * Pixel equality is between two independently exported semantic clips; the raw
 * native capture equivalence is checked by test-avatar-return.mjs. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const { PNG } = require('pngjs');
const output = '.local/avatar-motion-returns';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = { cases: [], errors: [], forbidden: [], motionRequests: [] };
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') report.errors.push(m.text());
  });
  page.on('request', (r) => {
    if (/bloom-character|orbit-characters|preparation-worker|\.wasm(?:\?|$)/.test(r.url()))
      report.forbidden.push(r.url());
    if (
      r.resourceType() === 'fetch' &&
      /packed-motion\/.*\.bin|computer-motion\.json|assets\/motion\/.*\.json/.test(r.url())
    )
      report.motionRequests.push(r.url());
  });
  await page.setViewport({ width: 640, height: 320, deviceScaleFactor: 1 });
  const url = 'http://localhost:6006/avatar-motion-returns.html';
  const cdp = await page.createCDPSession();
  cdp.on('Fetch.requestPaused', (r) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: r.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from(
        '<!doctype html><html><head><link rel="icon" href="data:,"></head><body style="margin:0;background:#f5f5f2"><canvas style="display:block;width:640px;height:320px"></canvas></body></html>',
      ).toString('base64'),
    }),
  );
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: url, requestStage: 'Request' }] });
  await page.goto(url);
  await cdp.send('Fetch.disable');
  await cdp.detach();
  const presets = await page.evaluate(async () => {
    const [{ AuthoredAvatarEngine }, { AVATAR_PRESETS }] = await Promise.all([
      import('/runtime/avatar/authored-engine.ts'),
      import('/runtime/avatar/catalog.ts'),
    ]);
    window.engine = new AuthoredAvatarEngine(document.querySelector('canvas'), {
      count: 2,
      size: 320,
    });
    await engine.loaded;
    return [...AVATAR_PRESETS];
  });
  const paint = async (fn, arg) => {
    const before = await page.evaluate(fn, arg);
    await page.waitForFunction((n) => engine.stats().frames > n, { timeout: 60000 }, before);
  };
  const capture = async (name, index = 0) => {
    const bytes = Buffer.from(
      await page.screenshot({ clip: { x: index * 320, y: 0, width: 320, height: 320 } }),
    );
    if (name) await writeFile(`${output}/${name}.png`, bytes);
    return PNG.sync.read(bytes).data;
  };
  const selected = process.env.AVATAR_RETURN_PRESETS?.split(',') ?? presets;
  assert(selected.every((preset) => presets.includes(preset)));
  for (const preset of selected) {
    const index = presets.indexOf(preset);
    await page.evaluate(
      async ({ preset, neighbor }) => {
        engine.setPaused(true);
        await engine.setPresets([preset, neighbor]);
        engine.resetAppearance();
        engine.setMotionFrame(1, 'idle', 0);
      },
      { preset, neighbor: presets[(index + 1) % presets.length] },
    );
    const returns = await page.evaluate(() => {
      const s = engine.asset(engine.states[0].preset).samplers;
      return [
        { kind: 'work', time: s.workReturn?.time, idleTime: s.workReturn?.idleTime },
        ...(s.reactionReturnTime === undefined
          ? []
          : [{ kind: 'reaction', time: s.reaction.clip.duration, idleTime: s.reactionReturnTime }]),
      ];
    });
    for (const ending of returns) {
      assert(
        Number.isFinite(ending.time) && Number.isFinite(ending.idleTime),
        `${preset} verified ${ending.kind} return`,
      );
      await paint(({ kind, time }) => {
        const n = engine.stats().frames;
        engine.setMotionFrame(0, kind, time);
        return n;
      }, ending);
      const expected = await capture(`${preset}-${ending.kind}-endpoint`);
      const neighbor = await capture(null, 1);
      for (let cycle = 0; cycle < 3; cycle++) {
        await paint(({ kind, time }) => {
          const n = engine.stats().frames;
          engine[kind === 'work' ? 'work' : 'react'](0);
          // Freeze the engine clock, not its pose: tick still runs the real
          // controller. Browser RAF resumption is checked separately below.
          engine.paused = true;
          engine.time = engine.states[0].motion.started + time;
          engine.invalidate();
          return n;
        }, ending);
        const state = await page.evaluate(() => ({
          motion: engine.stats().states[0],
          props: engine.batches.filter(
            (b) => b.part.source.activity === 'computer' && b.mesh.visible,
          ).length,
          glError: engine.renderer.getContext().getError(),
        }));
        assert.equal(
          state.motion.motion,
          'idle',
          `${preset} ${ending.kind} returns on cycle ${cycle}`,
        );
        assert(Math.abs(state.motion.motionTime - ending.idleTime) < 1e-9);
        assert.equal(state.props, 0);
        assert.equal(state.glError, 0);
        assert(
          (await capture(`${preset}-${ending.kind}-return-${cycle}`)).equals(expected),
          `${preset} ${ending.kind}: endpoint pixels must be identical after return`,
        );
        assert(
          (await capture(null, 1)).equals(neighbor),
          `${preset}: held neighbor must not change`,
        );
      }
      // The avatar must keep animating after the finite clip has ended.
      await page.evaluate(() => engine.setPaused(false));
      const first = await page.evaluate(() => engine.stats().frames);
      await page.waitForFunction(
        (first) => engine.stats().frames >= first + 3,
        { timeout: 60000 },
        first,
      );
      const live = await page.evaluate(() => engine.stats());
      assert.equal(live.states[0].motion, 'idle');
      assert.equal(live.contexts, 1);
      await page.evaluate(() => {
        engine.paused = true;
      });
      report.cases.push({
        preset,
        kind: ending.kind,
        cycles: 3,
        exactEndpointPixels: true,
        neighborPixelsChanged: 0,
        resumedFrames: live.frames - first,
      });
      console.log(JSON.stringify(report.cases.at(-1)));
    }
  }
  await page.evaluate(() => engine.dispose());
  assert.equal(await page.evaluate(() => engine.stats().contexts), 0);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.forbidden, []);
  assert(
    report.motionRequests.every((url) => /packed-motion\/.*\.bin/.test(url)),
    'Runtime uses packed motion only',
  );
  assert.equal(
    new Set(report.motionRequests).size,
    report.motionRequests.length,
    'One shared motion load per preset across repeated episodes',
  );
  const expectedPresets = new Set([
    'blue_beret',
    ...selected,
    ...selected.map((preset) => presets[(presets.indexOf(preset) + 1) % presets.length]),
  ]);
  const loadedPresets = new Set(
    report.motionRequests.map((url) =>
      new URL(url).pathname
        .split('/')
        .at(-1)
        .replace(/\.bin$/, ''),
    ),
  );
  assert.deepEqual(
    loadedPresets,
    expectedPresets,
    'Every exercised preset must load its packed animation',
  );
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
