/** A stalled presentation must not consume a newly accepted action. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = { errors: [], cases: [] };
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.on('console', (m) => {
    if (/GL_INVALID|GL_OUT_OF_MEMORY/.test(m.text())) report.errors.push(m.text());
  });
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', {
    patterns: [
      {
        urlPattern: '*/avatar-action-presentation.html',
        requestStage: 'Request',
      },
    ],
  });
  cdp.on('Fetch.requestPaused', (event) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: event.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from(
        '<!doctype html><canvas style="width:256px;height:128px"></canvas>',
      ).toString('base64'),
    }),
  );
  await page.goto('http://localhost:6006/avatar-action-presentation.html');
  await cdp.send('Fetch.disable');
  await page.evaluate(async () => {
    const { AuthoredAvatarEngine } = await import('/runtime/avatar/authored-engine.ts');
    window.firstPresentations = {};
    window.presentationKind = null;
    window.engine = new AuthoredAvatarEngine(document.querySelector('canvas'), {
      count: 2,
      size: 128,
      onFrame: () => {
        if (window.presentationKind && !firstPresentations[presentationKind])
          firstPresentations[presentationKind] = {
            states: engine.stats().states,
            clock: engine.time,
            matrix: engine.states[0].matrix.elements.slice(),
          };
      },
    });
    await engine.loaded;
    engine.idle(0);
    engine.idle(1);
  });
  await page.waitForFunction(() => engine.stats().frames > 2, {
    timeout: 60000,
  });
  for (const kind of ['reaction', 'work', 'entrance']) {
    const before = await page.evaluate(
      (kind) =>
        new Promise((resolve) =>
          requestAnimationFrame(() => {
            engine.idle(0);
            const neighbor = engine.stats().states[1];
            const previousClock = engine.time;
            if (kind === 'entrance') engine.entrance(0);
            else if (!engine[kind === 'reaction' ? 'react' : 'work'](0))
              throw Error('Action rejected');
            presentationKind = kind;
            const start = performance.now();
            while (performance.now() - start < 3500) {} // Real event-loop stall, no clock patch.
            resolve({
              neighborTime: neighbor.motionTime,
              clock: previousClock,
            });
          }),
        ),
      kind,
    );
    await page.waitForFunction((kind) => !!firstPresentations[kind], { timeout: 30000 }, kind);
    const first = await page.evaluate((kind) => {
      presentationKind = null;
      return firstPresentations[kind];
    }, kind);
    report.cases.push({ kind, before, first });
    if (kind !== 'entrance') {
      assert.equal(first.states[0].motion, kind);
      assert.equal(first.states[0].motionTime, 0, 'The first presented action sample is t=0');
    } else
      assert.ok(
        Math.abs(Math.hypot(...first.matrix.slice(0, 3)) - 0.1) < 1e-12,
        'Entrance begins at its initial scale',
      );
    assert.equal(first.states[1].motion, 'idle');
    assert.ok(
      first.states[1].motionTime - before.neighborTime >= 3.4,
      'Neighbor preserves elapsed wall time',
    );
  }
  await page.evaluate(() => engine.dispose());
  assert.deepEqual(report.errors, []);
  console.log('PASS three delayed commands; first frame visible, neighbor clock preserved');
} finally {
  await mkdir('.local/avatar-action-presentation', { recursive: true });
  await writeFile('.local/avatar-action-presentation/report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
