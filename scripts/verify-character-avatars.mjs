/** Live browser gate: pixels, pointer reactions, activity, static preview cleanup.
 * BLOOM_PLAYWRIGHT_MODULE may point to an existing Playwright installation.
 * node scripts/verify-character-avatars.mjs [http://localhost:6006]
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 900 },
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/__bloom_avatar_gate.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><body></body></html>',
    }),
  );
  await page.goto(`${base}/__bloom_avatar_gate.html`);
  await page.evaluate(async () => {
    document.body.replaceChildren();
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:240px;height:240px';
    document.body.appendChild(canvas);
    window.runtime = await import('/bloom-character/runtime.mjs');
    window.props = {
      config: {
        motion: 35,
        lookAt: 'wander',
        character: { preset: 'blue_beret' },
      },
      interactive: true,
      workingKey: 0,
      reactionKey: 0,
    };
    window.control = await runtime.createAvatar(canvas, props, {
      onReady: () => (window.ready = true),
      onError: (e) => (window.fail = String(e)),
    });
  });
  await page.waitForFunction(() => window.ready || window.fail, {}, { timeout: 30000 });
  assert.equal(await page.evaluate(() => window.fail), undefined);
  await page.locator('canvas').first().click();
  assert.equal(await page.evaluate(() => control.diagnostics().lastReaction), 0);
  await page.evaluate(() => {
    props = { ...props, workingKey: 1 };
    control.update(props);
  });
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => control.diagnostics().activityMode), true);
  assert.equal(
    await page.evaluate(() => control.diagnostics().lastActivityResult),
    0,
    'The original engine must accept the working activity',
  );
  await page.waitForFunction(() => !control.diagnostics().activityMode, {}, { timeout: 30000 });
  assert.equal(await page.evaluate(() => control.diagnostics().activityMode), false);
  await page.evaluate(() => {
    props = { ...props, paused: true };
    control.update(props);
  });
  await page.waitForFunction(() => runtime.runtimeStats().active === 0);
  const frozen = await page
    .locator('canvas')
    .first()
    .evaluate((c) => c.toDataURL());
  await page.waitForTimeout(150);
  assert.equal(
    await page
      .locator('canvas')
      .first()
      .evaluate((c) => c.toDataURL()),
    frozen,
  );
  // A part change must retain the last painted portrait during preparation.
  await page.evaluate(() => {
    window.transitionPixels = [];
    window.checkTransition = true;
    const capture = () => {
      const c = document.querySelector('canvas');
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let painted = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 24) painted++;
      transitionPixels.push(painted);
      if (checkTransition) requestAnimationFrame(capture);
    };
    capture();
    props = {
      ...props,
      config: {
        ...props.config,
        character: {
          preset: 'blue_beret',
          selections: { shape: 'heart', color: 'pink' },
        },
      },
    };
    control.update(props);
  });
  await page.waitForFunction(() => runtime.runtimeStats().active === 0, {}, { timeout: 30000 });
  await page.evaluate(() => {
    window.checkTransition = false;
  });
  assert.ok(
    await page.evaluate(() => transitionPixels.every((n) => n > 100)),
    'Changing a shape must not replace the painted portrait with a blank frame',
  );
  assert.notEqual(
    await page
      .locator('canvas')
      .first()
      .evaluate((c) => c.toDataURL()),
    frozen,
    'The changed parts must actually reach the painted avatar',
  );
  await page.evaluate(() => {
    props = { ...props, paused: false, reactionKey: 1 };
    control.update(props);
  });
  await page.waitForFunction(
    () => control.diagnostics().lastReaction === 0,
    {},
    { timeout: 30000 },
  );
  assert.equal(
    await page.evaluate(() => control.diagnostics().lastReaction),
    0,
    'Customized presets must accept an original reaction',
  );
  assert.equal(
    await page.evaluate(() => control.diagnostics().lastReactionKind),
    1,
    'Customized presets fall back to the original Wave',
  );
  // A cached duplicate must contain the final edited color, not a frame from
  // the debounce interval or the preceding appearance transition.
  await page.evaluate(() => {
    props = {
      ...props,
      paused: true,
      config: {
        ...props.config,
        character: { ...props.config.character, bodyColor: '#ff6600' },
      },
    };
    control.update(props);
  });
  await page.waitForFunction(
    () => !control.diagnostics().pending && runtime.runtimeStats().instances === 0,
    {},
    { timeout: 30000 },
  );
  const cachedCopy = await page.evaluate(async () => {
    const original = document.querySelector('canvas');
    const duplicate = document.createElement('canvas');
    duplicate.style.cssText = original.style.cssText;
    document.body.appendChild(duplicate);
    const copy = await runtime.createAvatar(duplicate, props);
    const result = {
      same: duplicate.toDataURL() === original.toDataURL(),
      ready: copy.diagnostics().ready,
    };
    copy.dispose();
    duplicate.remove();
    return result;
  });
  assert.deepEqual(cachedCopy, { same: true, ready: true });
  await page.evaluate(() => control.dispose());
  assert.equal(await page.evaluate(() => runtime.runtimeStats().instances), 0);

  await page.evaluate(async () => {
    document.body.replaceChildren();
    window.controllers = [];
    window.completed = 0;
    window.failures = [];
    for (let i = 0; i < 24; i++) {
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'width:64px;height:64px';
      document.body.appendChild(canvas);
      controllers.push(
        await runtime.createAvatar(
          canvas,
          {
            config: {
              motion: 35,
              lookAt: 'center',
              character: {
                preset: ['blue_beret', 'purple_heart', 'lime_frog'][i % 3],
                selections: { color: ['pink', 'blue', 'cyan', 'lime'][i % 4] },
              },
            },
            paused: true,
            portrait: true,
          },
          {
            onReady: () => completed++,
            onError: (e) => failures.push(String(e)),
          },
        ),
      );
    }
  });
  await page.waitForFunction(() => completed === 24 || failures.length, {}, { timeout: 60000 });
  await page.waitForTimeout(100);
  const portraits = await page.evaluate(() => ({
    completed,
    failures,
    stats: runtime.runtimeStats(),
    canvases: document.querySelectorAll('canvas').length,
    pixels: [...document.querySelectorAll('canvas:not([id])')].map((c) => {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let count = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i]) count++;
      return count;
    }),
  }));
  assert.equal(portraits.completed, 24);
  assert.deepEqual(portraits.failures, []);
  assert.equal(portraits.stats.instances, 0, 'Static previews must release their engine/context');
  assert.equal(portraits.stats.active, 0);
  assert.equal(portraits.canvases, 24);
  assert.ok(
    portraits.pixels.every((n) => n > 100),
    'Ready callbacks alone do not prove visible pixels',
  );
  await page.evaluate(() => controllers.forEach((c) => c.dispose()));
  assert.deepEqual(errors, []);
  console.log(
    'PASS: beta touch reaction, activity/return, frozen pixels, visible part transitions, 24 visible cached previews, engine cleanup',
  );
} finally {
  await browser.close();
}
