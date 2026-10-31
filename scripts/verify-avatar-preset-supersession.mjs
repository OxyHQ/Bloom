/** Cold recipe fetches cannot block newer cached choices or grow without a bound. */
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
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', {
    patterns: [{ urlPattern: '*avatar-preset-supersession.html' }],
  });
  cdp.on('Fetch.requestPaused', (event) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: event.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from('<!doctype html><body></body>').toString('base64'),
    }),
  );
  await page.goto(
    `${process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007'}/avatar-preset-supersession.html`,
  );
  await cdp.send('Fetch.disable');
  const result = await page.evaluate(async (built) => {
    document.body.replaceChildren();
    performance.setResourceTimingBufferSize(5000);
    let runtime, pool;
    if (built) {
      const { loadCharacterRuntime } = await import(
        '/src/agent-avatar/character-runtime-module.ts'
      );
      runtime = await loadCharacterRuntime(
        new URL('/bloom-character/runtime.mjs', location.href).href,
      );
      await runtime.diagnostics();
      const poolUrl = performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .find((url) => /\/chunks\/avatar-pool-[^/]+\.mjs(?:\?|$)/.test(url));
      if (!poolUrl) throw Error('Built loader did not load its actual pool module');
      pool = await import(poolUrl);
    } else {
      const runtimeUrl = '/runtime/avatar-runtime.ts';
      runtime = await import(runtimeUrl);
      const source = await (await fetch(runtimeUrl)).text();
      pool = await import(
        new URL(
          source.match(/import\(["']([^"']*avatar-pool[^"']*)["']\)/)[1],
          location.origin + runtimeUrl,
        ).href
      );
    }
    const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
    const wait = async (predicate, label) => {
      const start = performance.now();
      while (!predicate()) {
        if (performance.now() - start > 20000) throw Error(`Timed out: ${label}`);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    };
    const check = (value, label) => {
      if (!value) throw Error(label);
    };
    const original = window.fetch;
    const held = new Map(),
      requested = new Set();
    const released = new Set();
    window.fetch = async (url, ...args) => {
      const key = ['alfred', 'gus', 'purple_heart', 'lime_frog'].find((key) =>
        String(url).includes(key),
      );
      if (key) {
        requested.add(key);
        if (!released.has(key))
          await new Promise((resolve) => {
            const queue = held.get(key) ?? [];
            queue.push(resolve);
            held.set(key, queue);
          });
      }
      return original(url, ...args);
    };
    const release = (key) => {
      released.add(key);
      for (const done of held.get(key) ?? []) done();
      held.delete(key);
    };
    const props = (preset, color, reactionKey) => ({
      character: resolveAvatarCharacter({ preset, ...(color ? { bodyColor: color } : {}) }),
      reduced: false,
      paused: true,
      interactive: true,
      reactionKey,
    });
    let ready = 0,
      failures = 0;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:64px;height:64px';
    document.body.append(canvas);
    const initial = props('blue_beret');
    const controller = await runtime.createAvatar(canvas, initial, {
      onReady: () => ready++,
      onError: () => failures++,
    });
    await wait(() => ready === 1, 'initial presentation');
    const stats = () => pool.editorPoolDiagnostics()[0].stats;
    const pixels = () => canvas.toDataURL();
    const firstImage = pixels();
    controller.update(props('alfred', '#ff0000', 1));
    await wait(() => requested.has('alfred'), 'first cold request');
    controller.update(props('gus', '#00ff00', 2));
    await wait(() => requested.has('gus'), 'second cold request');
    controller.update(props('purple_heart', '#ffffff', 3));
    await new Promise((resolve) => setTimeout(resolve, 40));
    controller.update(props('lime_frog', '#ffffff', 4));
    await new Promise((resolve) => setTimeout(resolve, 40));
    check(
      !requested.has('purple_heart') && !requested.has('lime_frog'),
      'More than two cold recipes started',
    );
    await controller.update(props('blue_beret', '#2244ee', 5));
    await wait(
      () => pixels() !== firstImage,
      'cached color presentation before old fetches finish',
    );
    check(
      stats().states[0].preset === 'blue_beret',
      'Cached latest recipe did not bypass cold loads',
    );
    check(
      held.has('alfred') && held.has('gus'),
      'Old fetches must remain pending during cached update',
    );
    // Same requested preset, new color: the engine is still blue, not the old pending Alfred.
    controller.update(props('alfred', '#ff0000', 6));
    const latest = controller.update(props('alfred', '#336699', 7));
    release('alfred');
    await latest;
    await wait(
      () => stats().states[0].preset === 'alfred' && !stats().pendingFitReads,
      'latest Alfred applied',
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
    const pigment = stats().states[0].pigment;
    check(pigment[2] > pigment[0], 'Latest blue color was replaced by stale red');
    const image = pixels(),
      motion = stats().states[0].motion;
    release('gus');
    await wait(() => stats().pendingAssets === 0, 'obsolete fetch settles');
    await new Promise((resolve) => setTimeout(resolve, 100));
    check(stats().states[0].preset === 'alfred', 'Late obsolete completion changed the recipe');
    check(pixels() === image, 'Late obsolete completion changed retained pixels');
    check(motion === 'reaction', 'Latest reaction did not start');
    // Dispose while a new cold request is held: its fetch must not keep a slot/context alive.
    controller.update(props('purple_heart', '#ccddff', 8));
    await wait(() => requested.has('purple_heart'), 'new request after capacity is released');
    controller.dispose();
    check(pool.editorPoolDiagnostics().length === 0, 'Dispose waited for old network');
    release('purple_heart');
    release('lime_frog');
    await new Promise((resolve) => setTimeout(resolve, 100));
    window.fetch = original;
    return {
      built,
      ready,
      failures,
      requested: [...requested],
      finalPools: pool.editorPoolDiagnostics().length,
      pigment,
      retained: true,
    };
  }, process.env.AVATAR_BUILT_RUNTIME === '1');
  assert.equal(result.ready, 1);
  assert.equal(result.failures, 0);
  assert.equal(result.finalPools, 0);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
