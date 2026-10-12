import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
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
    errors = [],
    originalRequests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (r.url().includes('character-runtime')) originalRequests.push(r.url());
  });
  await page.setViewport({ width: 1024, height: 600, deviceScaleFactor: 1 });
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', {
    patterns: [{ urlPattern: '*avatar-pointer-check.html', requestStage: 'Request' }],
  });
  cdp.on('Fetch.requestPaused', (e) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: e.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from('<!doctype html><html><body></body></html>').toString('base64'),
    }),
  );
  await page.goto('http://localhost:6006/avatar-pointer-check.html');
  await cdp.send('Fetch.disable');
  await page.evaluate(async () => {
    document.body.style.cssText = 'margin:0;background:#f5f5f2';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:1024px;height:512px;touch-action:none';
    document.body.append(canvas);
    const { AuthoredAvatarEngine } = await import(
      '/runtime/avatar/authored-engine.ts'
    );
    const { bindAvatarPointer } = await import('/runtime/avatar/bind-pointer.ts');
    window.engine = new AuthoredAvatarEngine(canvas, { count: 2, size: 512 });
    await window.engine.loaded;
    window.taps = [];
    window.selections = [];
    window.unbind = bindAvatarPointer(canvas, window.engine, {
      onSelect: (i) => window.selections.push(i),
      onTap: (i) => window.taps.push(i),
    });
  });
  await page.waitForFunction(() => window.engine.stats().frames > 0);
  const canvas = await page.$('canvas');
  const snap = async () => PNG.sync.read(Buffer.from(await canvas.screenshot()));
  const baseline = await snap();
  const states = () => page.evaluate(() => window.engine.stats().states.map((s) => s.pointer));
  const settleFrame = async () =>
    page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const hoverFrames = await page.evaluate(() => window.engine.stats().frames);
  await page.mouse.move(200, 150);
  await settleFrame();
  assert.equal(
    await page.evaluate(() => window.engine.stats().frames),
    hoverFrames,
    'Ignored hover schedules no GPU work',
  );
  assert(
    (await snap()).data.equals(baseline.data),
    'Blue unpressed hover preserves the exact painted pose',
  );
  await page.mouse.move(256, 256);
  await page.mouse.down();
  await page.mouse.move(380, 180);
  await settleFrame();
  const held = await states();
  assert(held[0].active && held[0].yaw > 0 && held[0].pitch < 0);
  assert.equal(held[1].yaw, 0);
  const dragged = await snap(),
    changed = [0, 0];
  for (let y = 0; y < 512; y++)
    for (let x = 0; x < 1024; x++) {
      const p = (y * 1024 + x) * 4;
      if ([0, 1, 2, 3].some((c) => baseline.data[p + c] !== dragged.data[p + c]))
        changed[x < 512 ? 0 : 1]++;
    }
  assert(changed[0] > 1000);
  assert.equal(changed[1], 0, 'Dragging does not repaint the neighbor differently');
  await page.mouse.move(800, 150);
  await settleFrame();
  assert.equal(
    (await states())[1].active,
    false,
    'Capture retains the original avatar across grid cells',
  );
  await page.mouse.up();
  await page.waitForFunction(
    () =>
      !window.engine.states[0].pointer.moving && window.engine.stats().states[0].pointer.yaw === 0,
  );
  await settleFrame();
  assert(
    (await snap()).data.equals(baseline.data),
    '512px release returns to exactly the same painted pixels',
  );
  const resting = await page.evaluate(() => window.engine.stats().frames);
  await new Promise((r) => setTimeout(r, 250));
  assert.equal(
    await page.evaluate(() => window.engine.stats().frames),
    resting,
    'Fixed pose has no perpetual decay RAF',
  );
  assert.deepEqual(
    await page.evaluate(() => window.taps),
    [],
    'A drag never triggers a tap reaction',
  );
  await page.mouse.click(768, 256);
  assert.deepEqual(await page.evaluate(() => window.taps), [1]);
  await page.mouse.move(256, 256);
  await page.mouse.down();
  await page.mouse.move(350, 180);
  await page.evaluate(() =>
    document
      .querySelector('canvas')
      .dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 })),
  );
  assert.equal((await states())[0].active, false, 'Cancel releases ownership');
  await page.mouse.up();
  await page.mouse.move(256, 256);
  await page.mouse.down();
  await page.mouse.move(350, 180);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  assert.equal((await states())[0].active, false, 'Window blur releases ownership');
  await page.mouse.up();
  // The cutoff must be pixel-equivalent BEFORE snapping, not merely reset back
  // to baseline. Pin both signs and cross-axis combinations at the highest backing.
  const cutoff = [];
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
    for (const kind of ['reference', 'work', 'reaction']) {
      await page.evaluate((kind) => {
        window.engine.resetAppearance();
        if (kind !== 'reference') window.engine.setMotionFrame(0, kind, 1.2);
      }, kind);
      await settleFrame();
      const before = await snap();
      for (const [yaw, pitch] of [
        [9.99e-13, 9.99e-13],
        [-9.99e-13, 9.99e-13],
        [9.99e-13, -9.99e-13],
        [-9.99e-13, -9.99e-13],
      ]) {
        await page.evaluate(
          ({ yaw, pitch, kind }) => {
            window.engine.resetAppearance();
            if (kind !== 'reference') window.engine.setMotionFrame(0, kind, 1.2);
            const pointer = window.engine.states[0].pointer;
            pointer.active = true;
            pointer.yaw = yaw;
            pointer.pitch = pitch;
          },
          { yaw, pitch, kind },
        );
        await settleFrame();
        assert(
          (await snap()).data.equals(before.data),
          `${preset}/${kind}: cutoff itself is pixel-identical at 512px`,
        );
      }
      cutoff.push({ preset, kind, angles: 4 });
    }
  }
  await page.evaluate(() => {
    window.engine.resetAppearance();
    window.unbind();
    window.engine.dispose();
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(originalRequests, []);
  await mkdir('.local/avatar-pointer-browser', { recursive: true });
  const report = {
    changedPixels: changed,
    releasePixelsExact: true,
    cutoffPixelsExact: cutoff,
    quiescent: true,
    captureIsolation: true,
    cancel: true,
    blur: true,
    tapVsDrag: true,
    originalRequests,
    errors,
  };
  await writeFile('.local/avatar-pointer-browser/report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
