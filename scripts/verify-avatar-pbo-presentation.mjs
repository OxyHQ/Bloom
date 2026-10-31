/** Exact RGBA and immediate PNG checks precede any physical PBO throughput claim. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { startPBOAtlasFixture } from './fixtures/avatar/presentation/pbo-atlas-fixture.mjs';
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = { experimental: true, production: false, cases: [], errors: [] };
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => report.errors.push(error.message));
  await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 2 });
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*avatar-pbo-fixture.html' }] });
  cdp.on('Fetch.requestPaused', (event) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: event.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from('<!doctype html><body></body>').toString('base64'),
    }),
  );
  await page.goto(
    `${process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007'}/avatar-pbo-fixture.html`,
  );
  await cdp.send('Fetch.disable');
  for (const cssSize of (process.env.AVATAR_PBO_SIZES ?? '64,96,112,160')
    .split(',')
    .filter(Boolean)
    .map(Number)) {
    await page.evaluate(startPBOAtlasFixture, { mode: 'pbo', count: 8, cssSize });
    for (const kind of ['idle', 'reaction', 'work']) {
      const capture = await page.evaluate(
        (kind) => __avatarPBOFixture.captureHeld({ kind, time: kind === 'work' ? 1.5 : 0.5 }),
        kind,
      );
      report.cases.push(capture);
      console.log(
        JSON.stringify({
          cssSize,
          kind,
          changed: capture.cells.reduce((sum, cell) => sum + cell.rgba.changed, 0),
          maxChannel: Math.max(...capture.cells.map((cell) => cell.rgba.maxChannel)),
        }),
      );
      if (capture.cells.some((cell) => cell.rgba.changed || cell.png.changed)) break;
    }
    report.lastMetrics = await page.evaluate(async () => {
      const result = __avatarPBOFixture.read();
      await __avatarPBOFixture.dispose();
      return result;
    });
    if (
      report.cases.some((capture) =>
        capture.cells.some((cell) => cell.rgba.changed || cell.png.changed),
      )
    )
      break;
  }
  await page.evaluate(startPBOAtlasFixture, { mode: 'pbo', count: 1, cssSize: 64 });
  await page.evaluate(() => __avatarPBOFixture.captureHeld({ kind: 'idle', time: 0.5 }));
  report.lifecycle = await page.evaluate(async () => {
    const fixture = __avatarPBOFixture;
    const original = WebGL2RenderingContext.prototype.clientWaitSync;
    const hold = () => {
      WebGL2RenderingContext.prototype.clientWaitSync = function () {
        return this.TIMEOUT_EXPIRED;
      };
    };
    const wait = async (predicate, label) => {
      const started = performance.now();
      while (!predicate()) {
        if (performance.now() - started > 10000) throw Error('Timed out: ' + label);
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    };
    try {
      hold();
      fixture.resumeLive();
      await wait(() => fixture.read().pending === 2, 'two held batches');
      const held = fixture.read();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const bounded = fixture.read();
      if (bounded.frames !== held.frames || bounded.pending !== 2)
        throw Error('Rendering continued through saturated backpressure');
      WebGL2RenderingContext.prototype.clientWaitSync = original;
      await wait(
        () => fixture.read().completed >= held.completed + 3,
        'deferred scheduler resumes',
      );
      hold();
      await wait(() => fixture.read().pending === 2, 'second held batch pair');
      const capture = fixture.captureHeld().then(
        () => 'unexpected image',
        (error) => error.message,
      );
      const beforeDispose = fixture.read();
      await fixture.dispose();
      const captureResult = await capture;
      await new Promise((resolve) => setTimeout(resolve, 30));
      const afterDispose = fixture.read();
      return {
        heldFrames: held.frames,
        boundedFrames: bounded.frames,
        maximumPending: bounded.maxPending,
        deferredFrame: bounded.deferredFrame,
        captureResult,
        beforeDisposeDestinations: beforeDispose.destinations,
        afterDisposeDestinations: afterDispose.destinations,
        remainingReads: afterDispose.reads,
        remainingBatches: afterDispose.pending,
        errors: afterDispose.errors,
      };
    } finally {
      WebGL2RenderingContext.prototype.clientWaitSync = original;
      await fixture.dispose();
    }
  });
  assert.equal(report.lifecycle.maximumPending, 2);
  assert.equal(report.lifecycle.deferredFrame, true);
  assert.equal(report.lifecycle.captureResult, 'Fixture disposed');
  assert.equal(report.lifecycle.remainingReads, 0);
  assert.equal(report.lifecycle.remainingBatches, 0);
  assert.equal(
    report.lifecycle.afterDisposeDestinations,
    report.lifecycle.beforeDisposeDestinations,
  );
  assert.deepEqual(report.lifecycle.errors, []);
  const output = process.env.AVATAR_PBO_OUTPUT || '.local/avatar-pbo-presentation';
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  assert.deepEqual(report.errors, []);
  for (const capture of report.cases) {
    assert.deepEqual(capture.errors, []);
    for (const cell of capture.cells) {
      assert.equal(cell.rgba.changed, 0, `RGBA ${capture.cssSize}/${capture.kind}/${cell.index}`);
      assert.equal(cell.png.changed, 0, `PNG ${capture.cssSize}/${capture.kind}/${cell.index}`);
    }
  }
  if (report.lastMetrics) assert.ok(report.lastMetrics.maxPending <= 2);
} finally {
  await browser.close();
}
