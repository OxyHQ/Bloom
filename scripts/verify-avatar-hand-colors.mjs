/** Real pixels: hands follow the body tint, props and neighbouring avatars do not. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const { PNG } = require('pngjs');
const output = '.local/avatar-hand-colors';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = { presets: [], errors: [], originalRequests: [] };
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => report.errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') report.errors.push(m.text());
  });
  page.on('request', (r) => {
    if (/bloom-character|orbit-characters|preparation-worker|\.wasm(?:\?|$)/.test(r.url()))
      report.originalRequests.push(r.url());
  });
  await page.setViewport({ width: 640, height: 320, deviceScaleFactor: 1 });
  const url = `${process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6006'}/hand-color-check.html`;
  const cdp = await page.createCDPSession();
  cdp.on('Fetch.requestPaused', (r) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: r.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from(
        '<!doctype html><html><head><link rel="icon" href="data:,"></head><body style="margin:0;background:#f5f5f2"><canvas style="width:640px;height:320px;display:block"></canvas></body></html>',
      ).toString('base64'),
    }),
  );
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: url, requestStage: 'Request' }] });
  await page.goto(url);
  await cdp.send('Fetch.disable');
  await cdp.detach();
  await page.evaluate(async () => {
    const { AuthoredAvatarEngine } = await import(
      '/runtime/avatar/authored-engine.ts'
    );
    window.engine = new AuthoredAvatarEngine(document.querySelector('canvas'), {
      count: 2,
      size: 320,
      poseOverrides: true,
    });
    await engine.loaded;
    engine.setPaused(true);
  });
  const paint = async (fn, arg) => {
    const frames = await page.evaluate(() => engine.stats().frames);
    await page.evaluate(fn, arg);
    await page.waitForFunction((n) => engine.stats().frames > n, { timeout: 60000 }, frames);
  };
  const pixels = async () => PNG.sync.read(Buffer.from(await page.screenshot()));
  const changed = (a, b) => {
    let selected = 0,
      neighbor = 0;
    for (let y = 0; y < 320; y++)
      for (let x = 0; x < 640; x++) {
        const at = (y * 640 + x) * 4;
        if ([0, 1, 2, 3].some((k) => a.data[at + k] !== b.data[at + k])) {
          if (x < 320) selected++;
          else neighbor++;
        }
      }
    return { selected, neighbor };
  };
  for (const preset of [
    'blue_beret',
    'alfred',
    'purple_heart',
    'lime_frog',
    'coral_monocle',
    'gus',
    'blue_spectacles',
    'lime_headphones',
  ]) {
    await page.evaluate(async (preset) => {
      await engine.setPresets([preset]);
      engine.setPaused(true);
      engine.resetAppearance();
    }, preset);
    for (const mode of ['hands', 'props']) {
      await paint(async (mode) => {
        const asset = engine.assets.get(`${engine.stats().states[0].preset}:${engine.detail}`);
        const sampler = asset.samplers.work;
        const sampled = sampler.createPose();
        sampler.sample(2, sampled);
        const sources = asset.source.parts;
        const ids = new Set(sources.map(s => `${s.fur ? 'fur' : 'mesh'}:${s.id}`));
        const pose = sampled.filter(p => ids.has(p.id));
        // Some work-loop-only props have no one-shot work track. Match the
        // engine's hidden reference state for those extra renderable parts.
        const Matrix4 = pose[0].world.constructor;
        for (const source of sources) {
          const id = `${source.fur ? 'fur' : 'mesh'}:${source.id}`;
          if (pose.some(p => p.id === id)) continue;
          if (!source.activity) throw Error(`Missing body motion ${id}`);
          const world = new Matrix4().fromArray(source.fields.world);
          pose.push({id,world,normalMatrix:world.clone().invert().transpose(),fields:{...source.fields,camera:[1,1,0,0]}});
        }
        for (const p of pose) {
          const source = sources.find((s) => `${s.fur ? 'fur' : 'mesh'}:${s.id}` === p.id);
          const hand = source.activity === 'computer' && source.colorRole === 'body';
          const show = mode === 'hands' ? hand : source.activity === 'computer' && !hand;
          if (!show) p.fields.camera[3] = 0;
        }
        engine.resetAppearance();
        window.isolatedPose = pose;
        engine.setPose(0, pose);
        engine.setMotionFrame(1, 'work', 2);
      }, mode);
      const before = await pixels();
      await paint(() => engine.setColor(0, '#e84a99'));
      const paintedHands = await page.evaluate(async () => {
        const target = [232, 74, 153].map((v) => {
          const c = v / 255;
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return engine.batches
          .filter(
            (b) =>
              b.slots.includes(0) &&
              b.part.source.activity === 'computer' &&
              b.part.source.colorRole === 'body',
          )
          .map((b) => {
            const slot = b.slots.indexOf(0),
              pigment = b.mesh.geometry.getAttribute('instancePigment');
            const tint = [pigment.getX(slot), pigment.getY(slot), pigment.getZ(slot)];
            const paint = b.part.motionTexture.image.data.slice(slot * 64 + 20, slot * 64 + 23);
            return { target, albedo: Array.from(paint, (v, k) => v * tint[k]) };
          });
      });
      assert.equal(paintedHands.length, 2, `${preset}: two hands follow the selected color`);
      for (const hand of paintedHands)
        for (let k = 0; k < 3; k++)
          assert(
            Math.abs(hand.albedo[k] - hand.target[k]) < 1e-6,
            `${preset}: hands use the selected paint, without the source hue bias`,
          );
      const after = await pixels();
      const change = changed(before, after);
      assert.equal(change.neighbor, 0, `${preset} ${mode}: neighbouring avatar stays identical`);
      if (mode === 'hands') assert(change.selected > 100, `${preset}: visible hand pixels change`);
      else
        assert.equal(
          change.selected,
          0,
          `${preset}: Computer panel/content/shadow keep authored colors`,
        );
      await page.screenshot({ path: `${output}/${preset}-${mode}-tinted.png` });
      await paint(() => {
        engine.resetAppearance();
        engine.setPose(0, window.isolatedPose);
        engine.setMotionFrame(1, 'work', 2);
      });
      assert(
        (await pixels()).data.equals(before.data),
        `${preset} ${mode}: original color restored exactly`,
      );
      report.presets.push({ preset, mode, ...change, resetPixelIdentical: true });
    }
  }
  report.glError = await page.evaluate(() => engine.renderer.getContext().getError());
  assert.equal(report.glError, 0);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.originalRequests, []);
  await page.evaluate(() => engine.dispose());
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
