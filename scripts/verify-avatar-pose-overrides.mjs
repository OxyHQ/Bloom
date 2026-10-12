/** Editor pose ownership and instance isolation, independent of controller parity. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const { PNG } = require('pngjs');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage(),
    errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewport({ width: 640, height: 320, deviceScaleFactor: 1 });
  await page.goto('http://localhost:6006/iframe.html');
  const setup = await page.evaluate(async () => {
    document.body.replaceChildren();
    document.body.style.cssText = 'margin:0;background:#f5f5f2';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:640px;height:320px;display:block';
    document.body.append(canvas);
    const { createObservationReview, loadObservationReview } = await import(
      '/runtime/avatar/observation-review.ts'
    );
    const { AuthoredMotionSampler } = await import('/runtime/avatar/motion.ts');
    const data = await loadObservationReview('lime_frog', 'reaction');
    const review = (window.poseReview = createObservationReview(canvas, data));
    await review.engine.loaded;
    review.engine.setCount(2);
    const sampler = new AuthoredMotionSampler(data.clip),
      shared = sampler.createPose();
    sampler.sample(0, shared);
    review.engine.setPose(0, shared);
    const first = shared[0].world.elements.slice();
    sampler.sample(3, shared);
    review.engine.setPose(1, shared);
    const second = shared[0].world.elements.slice();
    // Mutating caller-owned memory after assignment must not mutate either avatar.
    for (const part of shared) {
      part.world.elements.fill(100);
      part.normalMatrix.elements.fill(100);
      part.fields.colorRoughness.fill(100);
    }
    const stored = review.engine.states.map((state) =>
      state.poseOverride.get('mesh:0').world.elements.slice(),
    );
    let rejected = false;
    try {
      review.engine.setPose(0, []);
    } catch {
      rejected = true;
    }
    return { first, second, stored, rejected };
  });
  assert.deepEqual(setup.stored, [setup.first, setup.second]);
  assert.notDeepEqual(setup.first, setup.second);
  assert(setup.rejected, 'Wrong part identity/count rejected');
  await page.waitForFunction(() => window.poseReview.engine.stats().frames > 0);
  const before = PNG.sync.read(Buffer.from(await page.screenshot()));
  const frames = await page.evaluate(() => window.poseReview.engine.stats().frames);
  await page.evaluate(() => window.poseReview.engine.setColor(1, '#cc6688'));
  await page.waitForFunction((n) => window.poseReview.engine.stats().frames > n, {}, frames);
  const after = PNG.sync.read(Buffer.from(await page.screenshot()));
  const changed = [0, 0];
  for (let y = 0; y < 320; y++)
    for (let x = 0; x < 640; x++) {
      const p = (y * 640 + x) * 4;
      if ([0, 1, 2, 3].some((c) => before.data[p + c] !== after.data[p + c]))
        changed[x < 320 ? 0 : 1]++;
    }
  assert.equal(changed[0], 0);
  assert(changed[1] > 1000);
  const held = await page.evaluate(() => window.poseReview.engine.stats().frames);
  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.equal(await page.evaluate(() => window.poseReview.engine.stats().frames), held);
  await page.evaluate(() => window.poseReview.engine.dispose());
  assert.equal(await page.evaluate(() => window.poseReview.engine.stats().contexts), 0);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      ownedPoseMemory: true,
      invalidPartsRejected: true,
      changedPixels: changed,
      heldQuiescent: true,
      contextReleased: true,
    }),
  );
} finally {
  await browser.close();
}
