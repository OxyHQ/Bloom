/** Real pointer capture, edits, resize and disposal while a GPU batch is pending. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  await page.route('**/__deferred_input.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><body>',
    }),
  );
  await page.goto(
    `${process.argv[2] || 'http://localhost:6006'}/__deferred_input.html`,
  );
  await page.evaluate(async () => {
    const wait = WebGL2RenderingContext.prototype.clientWaitSync;
    window.holdUntil = 0;
    WebGL2RenderingContext.prototype.clientWaitSync = function (...args) {
      if (performance.now() < holdUntil) return this.TIMEOUT_EXPIRED;
      return wait.apply(this, args);
    };
    window.runtime = await import('/bloom-character/runtime.mjs');
    window.surface = await import('/bloom-character/shared-surface.mjs');
    window.gate = {
      ready: new Set(),
      controls: [],
      props: [],
      paints: [0, 0],
      errors: [],
      captures: 0,
    };
    for (let i = 0; i < 2; i++) {
      const canvas = document.createElement('canvas');
      canvas.id = `avatar-${i}`;
      canvas.style.cssText = 'width:96px;height:96px;touch-action:none';
      canvas.addEventListener('gotpointercapture', () => gate.captures++);
      document.body.append(canvas);
      const props = {
        config: {
          motion: 35,
          lookAt: 'wander',
          character: { preset: 'blue_beret' },
        },
        interactive: true,
        reactionKey: 0,
        workingKey: 0,
      };
      gate.props.push(props);
      gate.controls.push(
        await runtime.createAvatar(canvas, props, {
          onReady: () => gate.ready.add(i),
          onPaint: () => gate.paints[i]++,
          onError: (error) => gate.errors.push(String(error)),
        }),
      );
    }
  });
  await page.waitForFunction(
    () =>
      gate.ready.size === 2 &&
      gate.controls.every((c) => !c.diagnostics().pending),
  );
  await page.evaluate(() => {
    holdUntil = performance.now() + 700;
  });
  await page.waitForFunction(() => surface.sharedRenderPending());
  const box = await page.locator('#avatar-0').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  assert.equal(
    await page.evaluate(() => surface.sharedRenderPending()),
    true,
    'Pointer down/up must both precede GPU completion',
  );
  await page.waitForFunction(
    () => gate.controls[0].diagnostics().lastReaction === 0,
  );
  assert.ok(
    await page.evaluate(() => gate.captures > 0),
    'Real pointer capture must happen during the physical press',
  );
  await page.evaluate(() => {
    holdUntil = performance.now() + 350;
  });
  await page.waitForFunction(() => surface.sharedRenderPending());
  await page.evaluate(() => {
    gate.props[0] = {
      ...gate.props[0],
      config: {
        ...gate.props[0].config,
        character: { preset: 'blue_beret', selections: { eyes: 'oval' } },
      },
    };
    gate.controls[0].update(gate.props[0]);
    document.querySelector('#avatar-0').style.width = '128px';
    document.querySelector('#avatar-0').style.height = '128px';
    gate.controls[0].dispose();
    document.querySelector('#avatar-0').remove();
    gate.before = gate.paints[1];
  });
  await page.waitForFunction(
    () =>
      runtime.runtimeStats().instances === 1 && gate.paints[1] > gate.before,
  );
  assert.deepEqual(await page.evaluate(() => gate.errors), []);
  await page.evaluate(() => {
    holdUntil = performance.now() + 200;
  });
  await page.waitForFunction(() => surface.sharedRenderPending());
  await page.evaluate(() => gate.controls[1].dispose());
  await page.waitForFunction(
    () =>
      runtime.runtimeStats().surface.contexts === 0 &&
      !runtime.runtimeStats().legacy.worker,
  );
  assert.deepEqual(failures, []);
  console.log(
    'PASS: real quick tap during GPU wait, queued edit/resize/disposal, neighbour motion and final cleanup',
  );
} finally {
  await browser.close();
}
