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
  await page.goto(
    `${process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6006'}/editor-pool-check.html`,
  );
  await cdp.send('Fetch.disable');
  await page.evaluate(async () => {
    window.runtime = await import('/runtime/avatar-runtime.ts');
    const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
    const { characterFromLegacy } = await import('/src/agent-avatar/legacy-character.ts');
    // These gates still write a character as `{ preset, selections }`; the renderer takes it resolved.
    const resolved = (nested) => resolveAvatarCharacter(characterFromLegacy({ character: nested }));
    window.resolveTestCharacter = resolved;
    // Resolve the pool URL from the SAME transformed runtime module graph.
    const source = await (await fetch('/runtime/avatar-runtime.ts')).text();
    const match = source.match(/import\(["']([^"']*avatar-pool[^"']*)["']\)/);
    if (!match) throw Error('Missing runtime pool import');
    window.pool = await import(match[1]);
    window.props = {
      character: resolved({ preset: 'blue_beret' }),
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
      String(url).includes('furLTC1.bin')
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
  await page.waitForFunction(() => diag()[0].stats.states[0].motionTime > 0.25);
  // Hold the exact clock while high-LOD shaders compile. A live one-cycle
  // action may finish naturally before a software-GPU resize is observable.
  await page.evaluate(async () => {
    await controllers[0].update({ ...props, workingKey: 0, paused: true }, recipe);
  });
  const preResizeTime = await page.evaluate(() => diag()[0].stats.states[0].motionTime);
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
  assert.equal(
    await page.evaluate(() => diag()[0].stats.states[0].motionTime),
    preResizeTime,
    'LOD promotion preserves the running action clock',
  );
  await page.evaluate(async () => {
    await controllers[0].update({ ...props, workingKey: 0 }, recipe);
  });
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
    controllers.forEach((c) => {
      c.dispose();
    });
    canvases.forEach((c) => {
      c.remove();
    });
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
        character: resolveTestCharacter({
          preset: 'blue_beret',
          selections: { accessory: 'crown' },
        }),
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
  // The rendered batch may compact slots, but retained canvases and their state
  // keep their original identities. Exercise a live middle slot with gaps around it.
  await page.evaluate(async () => {
    window.retainedCanvases = [];
    window.retainedControllers = [];
    window.retainedRecipes = [];
    await Promise.all(
      Array.from({ length: 5 }, async (_, index) => {
        const canvas = make();
        retainedCanvases[index] = canvas;
        retainedRecipes[index] = {
          ...recipe,
          color: ['#ff4444', '#44ff44', '#4444ff', '#ffaa44', '#aa44ff'][index],
        };
        retainedControllers[index] = await pool.attachEditorAvatar(
          canvas,
          props,
          retainedRecipes[index],
        );
      }),
    );
  });
  await page.waitForFunction(
    () => diag()[0]?.stats.renderedInstances === 5 && diag()[0].stats.frames > 5,
  );
  const fullTriangles = await page.evaluate(() => diag()[0].stats.triangles);
  await page.evaluate(async () => {
    await Promise.all(
      retainedControllers.map((controller, i) =>
        controller.update({ ...props, paused: i !== 2 }, retainedRecipes[i]),
      ),
    );
  });
  await page.waitForFunction(() => diag()[0].stats.renderedInstances === 1);
  assert(
    (await page.evaluate(() => diag()[0].stats.triangles)) < fullTriangles / 2,
    'Retained slots remove actual geometry submissions',
  );
  const retainedPictures = await page.evaluate(() => retainedCanvases.map((c) => c.toDataURL()));
  await new Promise((r) => setTimeout(r, 500));
  const laterPictures = await page.evaluate(() => retainedCanvases.map((c) => c.toDataURL()));
  for (const i of [0, 1, 3, 4])
    assert.equal(laterPictures[i], retainedPictures[i], `Retained slot ${i} stays pixel-identical`);
  report.cases.push('middle-live-slot-compacts-gpu-work-and-preserves-retained-pixels');
  await page.evaluate(async () => {
    retainedRecipes[4] = { ...retainedRecipes[4], color: '#ff0000' };
    await retainedControllers[4].update({ ...props, paused: true }, retainedRecipes[4]);
  });
  await page.waitForFunction(
    (previous) =>
      retainedCanvases[4].toDataURL() !== previous && diag()[0].stats.renderedInstances === 1,
    {},
    retainedPictures[4],
  );
  const recolored = await page.evaluate(() => retainedCanvases.map((c) => c.toDataURL()));
  for (const i of [0, 1, 3])
    assert.equal(
      recolored[i],
      retainedPictures[i],
      `Repaint does not replace retained neighbor ${i}`,
    );
  await page.evaluate(() =>
    retainedControllers[2].update({ ...props, paused: true }, retainedRecipes[2]),
  );
  await page.waitForFunction(() => diag()[0].stats.renderedInstances === 0);
  const heldFrames = await page.evaluate(() => diag()[0].stats.frames);
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(await page.evaluate(() => diag()[0].stats.frames), heldFrames);
  await page.evaluate(async () => {
    retainedRecipes[4] = { ...retainedRecipes[4], color: '#00ff00' };
    await retainedControllers[4].update({ ...props, paused: true }, retainedRecipes[4]);
  });
  await page.waitForFunction(
    (previous) =>
      retainedCanvases[4].toDataURL() !== previous && diag()[0].stats.renderedInstances === 0,
    {},
    recolored[4],
  );
  const repaintFrames = await page.evaluate(() => diag()[0].stats.frames);
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(
    await page.evaluate(() => diag()[0].stats.frames),
    repaintFrames,
    'Paused recolor returns to quiescence',
  );
  report.cases.push('paused-recolor-repaints-correct-slot-once-and-returns-to-quiescence');
  await page.evaluate(() => retainedControllers[2].update(props, retainedRecipes[2]));
  await page.waitForFunction(
    (previous) => diag()[0].stats.renderedInstances === 1 && diag()[0].stats.frames > previous,
    {},
    repaintFrames,
  );
  await page.evaluate(() => {
    retainedCanvases[2].style.position = 'fixed';
    retainedCanvases[2].style.top = '20000px';
  });
  await page.waitForFunction(() => diag()[0].stats.renderedInstances === 0);
  const hiddenFrames = await page.evaluate(() => diag()[0].stats.frames);
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(
    await page.evaluate(() => diag()[0].stats.frames),
    hiddenFrames,
    'Offscreen slots remove the final active draw',
  );
  await page.evaluate(() => {
    retainedCanvases[2].style.position = '';
    retainedCanvases[2].style.top = '';
  });
  await page.waitForFunction(
    (previous) => diag()[0].stats.renderedInstances === 1 && diag()[0].stats.frames > previous,
    {},
    hiddenFrames,
  );
  report.cases.push('resume-and-offscreen-return-restore-the-original-slot');
  await page.evaluate(() => {
    retainedControllers.forEach((c) => {
      c.dispose();
    });
    retainedCanvases.forEach((c) => {
      c.remove();
    });
  });
  assert.deepEqual(await page.evaluate(() => diag()), []);
  assert.equal(await page.$$eval('[data-avatar-renderer]', (x) => x.length), 0);
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report));
} finally {
  await mkdir('.local/avatar-editor-pool', { recursive: true });
  await writeFile('.local/avatar-editor-pool/report.json', `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
}
