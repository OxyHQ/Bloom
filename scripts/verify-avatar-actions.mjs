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
const output = '.local/avatar-action-validation';
await mkdir(output, { recursive: true });
try {
  const page = await browser.newPage(),
    errors = [],
    originalRequests = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('request', (r) => {
    if (/bloom-character|\.wasm(?:$|\?)/.test(r.url())) originalRequests.push(r.url());
  });
  await page.setViewport({ width: 640, height: 320, deviceScaleFactor: 1 });
  const url = 'http://localhost:6006/avatar-actions-check.html';
  const cdp = await page.createCDPSession();
  cdp.on('Fetch.requestPaused', (r) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: r.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from(
        '<!doctype html><html><head><title>Avatar action checks</title></head><body style="margin:0;background:#f5f5f2"><canvas style="width:640px;height:320px;display:block"></canvas></body></html>',
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
    });
    await engine.loaded;
    engine.setPaused(true);
  });
  const changed = (a, b) => {
    const x = PNG.sync.read(Buffer.from(a)),
      y = PNG.sync.read(Buffer.from(b));
    let selected = 0,
      neighbor = 0;
    assert.equal(x.width, 640);
    assert.equal(y.width, 640);
    for (let row = 0; row < 320; row++)
      for (let col = 0; col < 640; col++) {
        const at = (row * 640 + col) * 4;
        if ([0, 1, 2, 3].some((k) => x.data[at + k] !== y.data[at + k])) {
          if (col < 320) selected++;
          else neighbor++;
        }
      }
    return { selected, neighbor };
  };
  const paint = async (fn, arg) => {
    const n = await page.evaluate(fn, arg);
    await page.waitForFunction((n) => engine.stats().frames > n, { timeout: 60000 }, n);
  };
  const report = { presets: [], originalRequests, errors };
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
    assert(await page.evaluate(() => engine.canReact(0) && engine.canIdle(0)));
    await paint(() => {
      const n = engine.stats().frames;
      engine.setMotionFrame(0, 'reaction', 0);
      engine.setMotionFrame(1, 'idle', 0);
      return n;
    });
    const before = await page.screenshot();
    await paint(() => {
      const n = engine.stats().frames;
      engine.setMotionFrame(0, 'reaction', 0.7);
      return n;
    });
    const delta = changed(
      before,
      await page.screenshot({ path: `${output}/${preset}-reaction.png` }),
    );
    assert(delta.selected > 1000, `${preset} reaction must visibly move`);
    assert.equal(delta.neighbor, 0, `${preset} changed its neighbor`);
    await paint(() => {
      const n = engine.stats().frames;
      engine.react(0);
      engine.react(0);
      engine.time += engine.asset(engine.states[0].preset).samplers.reaction.clip.duration + 0.01;
      engine.invalidate();
      return n;
    });
    assert.equal(await page.evaluate(() => engine.states[0].motion.kind), 'reaction');
    assert.equal(
      await page.evaluate(() => !!engine.states[0].motion.queuedReaction),
      false,
      'Queue is bounded and consumed',
    );
    await paint(() => {
      const n = engine.stats().frames;
      engine.time += engine.asset(engine.states[0].preset).samplers.reaction.clip.duration + 0.01;
      engine.invalidate();
      return n;
    });
    const end = await page.evaluate(() => engine.stats().states[0].motion);
    assert.equal(end, preset === 'blue_beret' ? 'reaction' : 'idle');
    assert.equal(await page.evaluate(() => engine.stats().contexts), 1);
    report.presets.push({ preset, ...delta, end });
  }
  await page.evaluate(() => engine.dispose());
  assert.equal(await page.evaluate(() => engine.stats().contexts), 0);
  assert.deepEqual(originalRequests, []);
  assert.deepEqual(errors, []);
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
