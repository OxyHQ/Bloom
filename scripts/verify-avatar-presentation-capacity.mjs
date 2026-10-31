/** The engine owns scheduling; a presenter never patches its RAF implementation. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007'}/iframe.html`);
  const result = await page.evaluate(async () => {
    document.body.replaceChildren();
    const { AuthoredAvatarEngine } = await import('/runtime/avatar/authored-engine.ts');
    const stage = document.createElement('canvas');
    stage.style.cssText = 'width:64px;height:64px';
    document.body.append(stage);
    let image,
      frames = 0;
    const engine = new AuthoredAvatarEngine(stage, {
      count: 1,
      size: 64,
      lazyWork: true,
      onFrame: () => {
        frames++;
        image = stage.toDataURL();
      },
    });
    const wait = async (predicate, label) => {
      const start = performance.now();
      while (!predicate()) {
        if (performance.now() - start > 15000) throw Error('Timed out: ' + label);
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    };
    await engine.loaded;
    engine.idle(0);
    engine.setPaused(false);
    await wait(() => frames > 0, 'first presentation');
    engine.setPresentationCapacity(false);
    const firstImage = image,
      blockedFrames = frames;
    engine.setPaused(true);
    engine.setMotionFrame(0, 'idle', 0.5);
    engine.setColor(0, '#ff0000');
    engine.setColor(0, '#336699');
    const expectedPigment = engine.stats().states[0].pigment;
    await new Promise((resolve) => setTimeout(resolve, 150));
    const whileBlocked = engine.stats();
    if (frames !== blockedFrames || image !== firstImage)
      throw Error('Rendered without presentation capacity');
    engine.setPresentationCapacity(true);
    await wait(() => frames > blockedFrames, 'deferred latest paint');
    const resumedFrames = frames;
    await new Promise((resolve) => setTimeout(resolve, 150));
    if (frames !== resumedFrames)
      throw Error('Frozen avatar kept scheduling after its deferred paint');
    const latest = engine.stats();
    const changed = image !== firstImage;
    engine.setPresentationCapacity(false);
    engine.setColor(0, '#00ff00');
    engine.dispose();
    engine.setPresentationCapacity(true);
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      blockedFrames,
      whileBlocked: {
        capacity: whileBlocked.presentationCapacity,
        queued: whileBlocked.presentationQueued,
      },
      resumedFrames,
      finalFrames: frames,
      changed,
      pigment: latest.states[0].pigment,
      expectedPigment,
      queueAfterResume: latest.presentationQueued,
    };
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(result.whileBlocked, { capacity: false, queued: true });
  assert.equal(result.resumedFrames, result.blockedFrames + 1);
  assert.equal(result.finalFrames, result.resumedFrames);
  assert.equal(result.changed, true);
  assert.equal(result.queueAfterResume, false);
  assert.deepEqual(result.pigment, result.expectedPigment);
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
