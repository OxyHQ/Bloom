/** Browser integration: Computer ignores pointer input; Headphones loads its own blink. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage(),
    errors = [],
    forbidden = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (r.url().includes('character-runtime')) forbidden.push(r.url());
  });
  await page.setViewport({ width: 224, height: 112, deviceScaleFactor: 1 });
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', {
    patterns: [{ urlPattern: '*avatar-activity-gaze-check.html' }],
  });
  cdp.on('Fetch.requestPaused', (e) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: e.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from('<!doctype html><html><body></body></html>').toString('base64'),
    }),
  );
  await page.goto('http://localhost:6006/avatar-activity-gaze-check.html');
  await cdp.send('Fetch.disable');
  await page.evaluate(async () => {
    document.body.style.cssText = 'margin:0;background:#f5f5f2';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:224px;height:112px';
    document.body.append(canvas);
    const { AuthoredAvatarEngine } = await import(
      '/runtime/avatar/authored-engine.ts'
    );
    window.engine = new AuthoredAvatarEngine(canvas, { count: 2, size: 112 });
    await window.engine.loaded;
    window.uploads = () =>
      window.engine.batches.map((b) => [
        Array.from(b.mesh.instanceMatrix.array),
        Array.from(b.part.motionTexture.image.data),
      ]);
  });
  const settle = () =>
    page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const snap = async () => Buffer.from(await page.screenshot());
  const report = [];
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
      await window.engine.setPresets([preset]);
    }, preset);
    await settle();
    for (const time of [0, 0.4, 1.2, 2.5, 3.1]) {
      await page.evaluate((time) => {
        const e = window.engine;
        e.resetAppearance();
        e.setPaused(true);
        e.setMotionFrame(0, 'work', time);
      }, time);
      await settle();
      const baseline = await snap(),
        matrices = await page.evaluate(() => window.uploads());
      await page.evaluate(() => {
        window.engine.beginPointer(56, 56);
        window.engine.point(100, 12);
      });
      await new Promise((r) => setTimeout(r, 150));
      assert.deepEqual(
        await page.evaluate(() => window.uploads()),
        matrices,
        `${preset}/${time} uploaded matrices/materials ignore activity pointer`,
      );
      assert(baseline.equals(await snap()), `${preset}/${time} all pixels unchanged by drag`);
      await page.evaluate(() => {
        window.engine.endPointer(100, 12);
        window.engine.point(100, 12);
      });
      await new Promise((r) => setTimeout(r, 150));
      assert(
        baseline.equals(await snap()),
        `${preset}/${time} all pixels unchanged after release/hover`,
      );
      report.push({ preset, time, matricesExact: true, pixelsExact: true });
    }
  }
  const blink = JSON.parse(
    await readFile(
      'runtime/avatar/assets/motion/lime-headphones-eye-blink.json',
      'utf8',
    ),
  ).clips.idle;
  const index = blink.samples.findIndex((v) => v > 0.5);
  assert(index >= 0, 'Observed blink must include a closed-eye frame');
  const sample = await page.evaluate((time) => {
    const e = window.engine;
    e.resetAppearance();
    e.setPaused(true);
    e.setMotionFrame(0, 'idle', time);
    return new Promise((r) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => r(e.states[0].pose[0].fields.eyeBlink)),
      ),
    );
  }, blink.times[index]);
  assert.equal(
    sample[0],
    blink.samples[index],
    'Actual renderer receives the independently packed hidden blink',
  );
  // Headphones idle and reaction have the same part count but different fields.
  // A fresh instance entering reaction first must still allocate idle's blink.
  await page.evaluate(() => {
    const e = window.engine;
    e.states[0].pose = undefined;
    e.setMotionFrame(0, 'reaction', 0.8);
  });
  await settle();
  await page.evaluate((time) => window.engine.setMotionFrame(0, 'idle', time), blink.times[index]);
  await settle();
  assert.equal(
    await page.evaluate(() => window.engine.states[0].pose[0].fields.eyeBlink[0]),
    blink.samples[index],
    'Reaction-to-idle rebinds the complete semantic pose',
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(forbidden, []);
  await page.evaluate(() => window.engine.dispose());
  await mkdir('.local/avatar-activity-gaze-browser', { recursive: true });
  await writeFile(
    '.local/avatar-activity-gaze-browser/report.json',
    JSON.stringify({ report, hiddenBlink: sample[0], errors, forbidden }, null, 2),
  );
  console.log(
    JSON.stringify({ workPoses: report.length, hiddenBlink: sample[0], errors, forbidden }),
  );
} finally {
  await browser.close();
}
