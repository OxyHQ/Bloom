/** A fresh action must start at its beginning after the renderer stopped RAF. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage(),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*avatar-quiescent-check.html' }] });
  cdp.on('Fetch.requestPaused', (e) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: e.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from('<!doctype html><html><body></body></html>').toString('base64'),
    }),
  );
  await page.goto('http://localhost:6006/avatar-quiescent-check.html');
  await cdp.send('Fetch.disable');
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:320px;height:320px';
    document.body.append(canvas);
    const { AuthoredAvatarEngine } = await import(
      '/runtime/avatar/authored-engine.ts'
    );
    window.engine = new AuthoredAvatarEngine(canvas);
    await window.engine.loaded;
  });
  await page.waitForFunction(() => window.engine.stats().frames > 0);
  const report = [];
  for (const kind of ['reaction', 'work']) {
    await page.evaluate(() => {
      window.engine.react(0);
      // Drive the actual finite-action controller to its native held endpoint.
      window.engine.time +=
        window.engine.asset('blue_beret').samplers.reaction.clip.duration + 0.01;
      window.engine.invalidate();
    });
    await page.waitForFunction(
      () =>
        window.engine.stats().states[0].motion === 'reaction' &&
        window.engine.stats().states[0].motionTime >=
          window.engine.asset('blue_beret').samplers.reaction.clip.duration &&
        !window.engine.raf,
    );
    const before = await page.evaluate(() => window.engine.stats().frames);
    await new Promise((r) => setTimeout(r, 800));
    assert.equal(
      await page.evaluate(() => window.engine.stats().frames),
      before,
      'Held blue stops submitting frames',
    );
    const result = await page.evaluate(
      (kind) =>
        new Promise((resolve) => {
          const engine = window.engine,
            original = engine.tick;
          engine.tick = (timestamp) => {
            engine.tick = original;
            original(timestamp);
            resolve(engine.stats().states[0]);
          };
          engine[kind === 'work' ? 'work' : 'react'](0);
        }),
      kind,
    );
    assert.equal(result.motion, kind);
    assert.equal(result.motionTime, 0, `${kind} must not inherit the idle wall-clock gap`);
    report.push({ kind, firstPresentedTime: result.motionTime });
  }
  assert.deepEqual(errors, []);
  await page.evaluate(() => window.engine.dispose());
  console.log(JSON.stringify({ report, errors }));
} finally {
  await browser.close();
}
