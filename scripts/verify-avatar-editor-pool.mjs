/** Real WebGL lifecycle/interaction checks for the editor's shared scene. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = { cases: [], errors: [], infrastructure: [] };
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => {
    if (e.message === 'WebSocket closed without opened.' && e.stack?.includes('/@vite/client:'))
      report.infrastructure.push({ message: e.message, stack: e.stack });
    else report.errors.push(e.message);
  });
  await page.setViewport({ width: 1000, height: 800, deviceScaleFactor: 2 });
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', {
    patterns: [{ urlPattern: '*editor-pool-check.html' }],
  });
  cdp.on('Fetch.requestPaused', (e) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: e.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from(
        '<!doctype html><body style="margin:0;display:flex;align-items:flex-start"></body>',
      ).toString('base64'),
    }),
  );
  await page.goto('http://localhost:6006/editor-pool-check.html');
  await cdp.send('Fetch.disable');
  await page.evaluate(async () => {
    window.runtime = await import('/runtime/avatar-runtime.ts');
    // Resolve the pool URL from the SAME transformed runtime module graph.
    const source = await (await fetch('/runtime/avatar-runtime.ts')).text();
    const match = source.match(/import\(["']([^"']*avatar-pool[^"']*)["']\)/);
    if (!match) throw Error('Missing runtime pool import');
    window.pool = await import(match[1]);
    window.props = {
      config: { character: { preset: 'blue_beret' }, motion: 1 },
      reduced: false,
      interactive: true,
    };
    window.recipe = {
      preset: 'blue_beret',
      capabilities: { key: 'blue', selected: {}, available: {} },
    };
    window.make = () => {
      const c = document.createElement('canvas');
      c.style.cssText = 'width:64px;height:64px;touch-action:none';
      document.body.append(c);
      return c;
    };
    window.diag = () => pool.editorPoolDiagnostics();
    window.controllers = [];
    window.canvases = [];
  });
  // Fail the first material fetch after module initialization, then recover.
  await page.evaluate(async () => {
    const saved = window.fetch;
    window.fetch = (url, ...rest) =>
      String(url).includes('furPile.bin')
        ? Promise.resolve(new Response('injected', { status: 503 }))
        : saved(url, ...rest);
    const canvas = make();
    let failed = false;
    try {
      await pool.attachEditorAvatar(canvas, props, recipe);
    } catch {
      failed = true;
    } finally {
      window.fetch = saved;
      canvas.remove();
    }
    if (!failed || diag().length || document.querySelector('[data-avatar-renderer]'))
      throw Error('Load failure leaked a pool');
  });
  report.cases.push('load-failure-releases-context-and-pool');
  await page.evaluate(async () => {
    const canvas = make(),
      abort = new AbortController();
    const task = pool.attachEditorAvatar(canvas, props, recipe, undefined, undefined, abort.signal);
    abort.abort();
    let reason;
    try {
      await task;
    } catch (error) {
      reason = error.name;
    }
    canvas.remove();
    if (reason !== 'AbortError' || diag().length) throw Error('Pending abort leaked');
  });
  report.cases.push('abort-during-initial-load-releases-reservation');
  await page.evaluate(async () => {
    const a = make(),
      b = make(),
      abort = new AbortController();
    const first = pool
      .attachEditorAvatar(a, props, recipe, undefined, undefined, abort.signal)
      .catch((e) => e.name);
    const second = pool.attachEditorAvatar(b, props, recipe);
    abort.abort();
    if ((await first) !== 'AbortError') throw Error('First pending attachment did not abort');
    const surviving = await second;
    if (diag().length !== 1 || diag()[0].avatars !== 1)
      throw Error('Abort destroyed pending neighbor');
    surviving.dispose();
    a.remove();
    b.remove();
    if (diag().length) throw Error('Pending lifetime leaked');
  });
  report.cases.push('pending-neighbor-keeps-pool-alive-after-first-aborts');

  await page.evaluate(async () => {
    await Promise.all(
      [0, 1].map(async (i) => {
        const c = make();
        canvases[i] = c;
        controllers[i] = await pool.attachEditorAvatar(c, props, recipe);
      }),
    );
  });
  await page.waitForFunction(
    () => diag().length === 1 && diag()[0].avatars === 2 && diag()[0].stats.frames > 3,
    { timeout: 90000 },
  );
  assert.equal(await page.evaluate(() => diag()[0].stats.contexts), 1);
  await page.evaluate(async () => {
    await Promise.all(controllers.map((c) => c.update({ ...props, paused: true }, recipe)));
  });
  await new Promise((r) => setTimeout(r, 300));
  const paused = await page.evaluate(() => ({
    frames: diag()[0].stats.frames,
    images: canvases.map((c) => c.toDataURL()),
  }));
  await new Promise((r) => setTimeout(r, 300));
  const pausedAgain = await page.evaluate(() => ({
    frames: diag()[0].stats.frames,
    images: canvases.map((c) => c.toDataURL()),
  }));
  assert.equal(pausedAgain.frames, paused.frames);
  assert(paused.images.every((image, i) => image === pausedAgain.images[i]));
  report.cases.push('two-independent-paused-previews-are-quiescent');
  await page.evaluate(async () => {
    await Promise.all(controllers.map((c) => c.update(props, recipe)));
  });
  await page.mouse.move(32, 32);
  await page.mouse.down();
  await page.waitForFunction(() => diag()[0].stats.states[0].pointer.active);
  await page.evaluate(async () => {
    const c = make();
    canvases[2] = c;
    controllers[2] = await pool.attachEditorAvatar(c, props, {
      ...recipe,
      preset: 'alfred',
    });
  });
  assert(await page.evaluate(() => diag()[0].stats.states[0].pointer.active));
  await page.evaluate(() => {
    controllers[2].dispose();
    canvases[2].remove();
    controllers.length = canvases.length = 2;
  });
  assert(await page.evaluate(() => diag()[0].stats.states[0].pointer.active));
  await page.mouse.up();
  report.cases.push('neighbor-mount-preset-load-and-dispose-preserve-held-drag');
  await page.evaluate(async () => {
    await controllers[0].update({ ...props, workingKey: 1 }, recipe);
  });
  await page.waitForFunction(() => diag()[0].stats.states[0].motionTime > 0.25);
  // Observe the restart in the same browser task: CDP round trips can exceed
  // the first 100 ms on software rendering while the action keeps advancing.
  assert(
    await page.evaluate(async () => {
      await controllers[0].update({ ...props, workingKey: 0 }, recipe);
      const state = diag()[0].stats.states[0];
      return state.motion === 'work' && state.motionTime < 0.1;
    }),
  );
  report.cases.push('work-key-one-to-zero-restarts-once');
  await page.evaluate(() => {
    canvases[0].style.width = canvases[0].style.height = '320px';
  });
  await page.waitForFunction(
    () =>
      diag()[0].cell === 320 &&
      diag()[0].stats.detail === 'high' &&
      diag()[0].stats.backingPixelsPerAvatar === 512,
    { timeout: 90000 },
  );
  assert.equal(await page.evaluate(() => diag()[0].avatars), 2);
  assert.equal(await page.evaluate(() => diag()[0].stats.states[0].motion), 'work');
  report.cases.push('resize-promotes-resolution-and-lod-without-restarting-action');
  await page.evaluate(async () => {
    const c = make();
    c.style.width = c.style.height = '320px';
    let failed = false;
    try {
      await pool.attachEditorAvatar(c, props, {
        ...recipe,
        preset: '__invalid__',
      });
    } catch {
      failed = true;
    }
    c.remove();
    if (!failed || diag().length !== 1 || diag()[0].avatars !== 2)
      throw Error('Failed preset leaked reservation');
  });
  report.cases.push('failed-preset-rolls-back-with-surviving-neighbors');
  await page.evaluate(async () => {
    await controllers[0].update({ ...props, workingKey: 2, reactionKey: 1 }, recipe);
    await controllers[0].update({ ...props, workingKey: 3, reactionKey: 0 }, recipe);
    if (diag()[0].stats.states[0].motion !== 'reaction')
      throw Error('Simultaneous commands must apply Work before Reaction, including key zero');
  });
  report.cases.push('simultaneous-work-before-reaction-including-zero-key');

  await page.evaluate(() => {
    controllers.forEach((c) => c.dispose());
    canvases.forEach((c) => c.remove());
  });
  assert.deepEqual(await page.evaluate(() => diag()), []);
  report.cases.push('final-dispose-removes-all-contexts-and-stages');
  await page.evaluate(async () => {
    window.catalogCanvas = make();
    window.catalogAvatar = await runtime.createAvatar(
      catalogCanvas,
      {
        ...props,
        workingKey: 1,
        config: {
          ...props.config,
          character: {
            preset: 'blue_beret',
            selections: { accessory: 'crown' },
          },
        },
      },
      {
        onError() {
          throw Error('Catalog adapter failed');
        },
      },
    );
  });
  await page.evaluate(() => catalogAvatar.update({ ...props, workingKey: 0 }));
  await page.waitForFunction(
    () => diag().some((p) => p.avatars === 1 && p.stats.states[0].motion === 'work'),
    { timeout: 90000 },
  );
  report.cases.push('catalog-to-preset-update-delivers-zero-work-key');
  await page.evaluate(() => {
    catalogAvatar.dispose();
    catalogCanvas.remove();
  });
  assert.deepEqual(await page.evaluate(() => diag()), []);
  assert.equal(await page.$$eval('[data-avatar-renderer]', (x) => x.length), 0);
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report));
} finally {
  await mkdir('.local/avatar-editor-pool', { recursive: true });
  await writeFile('.local/avatar-editor-pool/report.json', JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
