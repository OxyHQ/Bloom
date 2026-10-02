/** Original-engine preparation scope gate. Requires Storybook and Playwright.
 * Same appearance, distinct contours, contour return, FIFO cancellation,
 * one real rendering context and shared WASM, with painted-pixel assertions.
 * BLOOM_PLAYWRIGHT_MODULE may name an existing Playwright installation.
 * node scripts/verify-avatar-preparation-scope.mjs [http://localhost:6006]
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const boxes = {};
await (async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({
      viewport: { width: 700, height: 400 },
    });
    await page.route('**/__bloom_preparation.html', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><body>',
      }),
    );
    await page.goto(
      (process.argv[2] || 'http://localhost:6006') +
        '/__bloom_preparation.html',
    );
    await page.exposeFunction('capture', async (name) => {
      const png = await page.screenshot({
        path: '/tmp/bloom-preparation-' + name + '.png',
      });
      boxes[name] = await page.evaluate(async (encoded) => {
        const image = new Image();
        const loaded = new Promise((resolve) => (image.onload = resolve));
        image.src = 'data:image/png;base64,' + encoded;
        await loaded;
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        const { data, width, height } = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        let minX = width,
          minY = height,
          maxX = -1,
          maxY = -1;
        for (let y = 0; y < height; y++)
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            if (data[i + 2] > data[i] + 40 && data[i + 2] > data[i + 1] + 25) {
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
          }
        return { width: maxX - minX + 1, height: maxY - minY + 1 };
      }, png.toString('base64'));
    });
    const result = await page.evaluate(async () => {
      document.body.innerHTML =
        '<canvas id="shared" style="width:320px;height:320px"></canvas>';
      const contexts = new Set(),
        get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        const value = get.call(this, type, ...args);
        if (type.includes('webgl') && value) contexts.add(value);
        return value;
      };
      const requests = [];
      const BaseWorker = Worker;
      window.Worker = class extends BaseWorker {
        postMessage(data, ...args) {
          requests.push({
            id: data.id,
            key: data.key,
            points: data.points?.[0],
          });
          return super.postMessage(data, ...args);
        }
      };
      const adapter = await import('/bloom-character/legacy-engine.mjs');
      const { encodeAppearance } =
        await import('/bloom-character/appearance-codec.mjs');
      const points = (x, y) =>
        Array.from({ length: 64 }, (_, i) => {
          const a = (i * Math.PI * 2) / 64;
          return [Math.cos(a) * x, Math.sin(a) * y];
        });
      const triangle = Array.from({ length: 64 }, (_, i) => {
        const a = (i * Math.PI * 2) / 64,
          r = 0.8 + 0.2 * Math.cos(a * 3);
        return [Math.cos(a) * r, Math.sin(a) * r];
      });
      const original = await adapter.getCharacterEngine(),
        ellipse = await adapter.acquireLegacyEngine(points(0.55, 1.2)),
        tri = await adapter.acquireLegacyEngine(triangle);
      const generic = (eyes) =>
        encodeAppearance({
          version: 1,
          shape: 'circle',
          color: 'blue',
          eyes,
          eyewear: 'none',
          accessories: [],
          accessoryColors: {},
          constrained: 0,
          depth: 0.5,
          model: null,
          rig: null,
          hereCharacter: null,
        });
      const firstTurn = await adapter.acquireCharacterPreparation();
      const cancelled = new AbortController();
      const cancelledTurn = adapter
        .acquireCharacterPreparation(cancelled.signal)
        .then(
          () => {
            throw new Error('Cancelled waiter was admitted');
          },
          (error) => error.name,
        );
      const order = [];
      const secondTurn = adapter
        .acquireCharacterPreparation()
        .then((release) => {
          order.push('second');
          return release;
        });
      const thirdTurn = adapter
        .acquireCharacterPreparation()
        .then((release) => {
          order.push('third');
          return release;
        });
      cancelled.abort();
      firstTurn();
      (await secondTurn)();
      (await thirdTurn)();
      const cancelledResult = await cancelledTurn;
      const entries = [
        ['original', original, original.presetAppearance('blue_beret')],
        ['ellipse', ellipse.module, generic('oval')],
        ['triangle', tri.module, generic('oval')],
        ['ellipse-return', ellipse.module, generic('oval')],
        ['original-copy', original, original.presetAppearance('blue_beret')],
      ];
      const characters = [];
      for (const [name, engine, bytes] of entries) {
        const release = await adapter.acquireCharacterPreparation();
        const character = new engine.Character('#shared', 320, 320);
        character.setQuality(1);
        const restore = character.restore(bytes);
        character.setActive(true);
        for (let i = 0; i < 240; i++) {
          character.render(performance.now() / 1000);
          await new Promise((r) => setTimeout(r, 20));
          if (
            i > 10 &&
            !character.preparationStats().pending &&
            !character.hasPendingUpdate()
          )
            break;
        }
        characters.push({ name, character, restore });
        release();
      }
      const before = adapter.legacyEngineStats();
      for (let i = 0; i < 240; i++) {
        for (const { character } of characters)
          character.render(performance.now() / 1000);
        await new Promise((r) => setTimeout(r, 20));
        if (
          i > 10 &&
          characters.every(
            ({ character }) =>
              !character.preparationStats().pending &&
              !character.hasPendingUpdate(),
          )
        )
          break;
      }
      const results = [];
      for (const { name, character, restore } of characters) {
        for (let i = 0; i < 12; i++) {
          character.render(performance.now() / 1000);
          await new Promise((r) => setTimeout(r, 20));
        }
        results.push({
          name,
          restore,
          stats: character.preparationStats(),
          error: character.renderError(),
          preparationError: character.preparationError(),
          cache: character.characterCacheStats(),
        });
        await window.capture(name);
      }
      const retained = adapter.legacyEngineStats();
      const releaseInterrupted = await adapter.acquireCharacterPreparation();
      const interrupted = new ellipse.module.Character('#shared', 320, 320);
      interrupted.restore(generic('sleepy_lids'));
      interrupted.setActive(true);
      interrupted.render(performance.now() / 1000);
      releaseInterrupted();
      let admittedAfterRelease = false;
      const nextTurn = adapter.acquireCharacterPreparation().then(release => {
        admittedAfterRelease = true;
        return release;
      });
      await Promise.resolve();
      const blockedWhileNativePending = !admittedAfterRelease;
      interrupted.delete();
      (await nextTurn)();
      for (const { character } of characters) character.delete();
      ellipse.release();
      ellipse.release();
      tri.release();
      for (let i = 0; i < 100; i++) {
        await new Promise((r) => setTimeout(r, 20));
        if (
          !adapter.legacyEngineStats().pending &&
          !adapter.legacyEngineStats().worker
        )
          break;
      }
      return {
        order,
        cancelledResult,
        requests,
        contexts: contexts.size,
        sameFS:
          original.FS === ellipse.module.FS && original.FS === tri.module.FS,
        before,
        retained,
        blockedWhileNativePending,
        after: adapter.legacyEngineStats(),
        results,
      };
    });
    fs.writeFileSync(
      '/tmp/bloom-shared-engine-gate.json',
      JSON.stringify(
        result,
        (k, v) => (typeof v === 'bigint' ? v.toString() : v),
        2,
      ),
    );
    assert.equal(result.contexts, 1);
    assert.equal(result.sameFS, true);
    assert.equal(result.retained.sharedModules, 1);
    assert.equal(result.retained.characters, 5);
    assert.equal(result.after.modules, 0);
    assert.equal(result.after.characters, 0);
    assert.equal(result.after.pending, 0);
    assert.equal(result.after.worker, false);
    assert.equal(result.after.preparationWaiters, 0);
    assert.equal(result.after.preparationActive, false);
    assert.equal(result.after.dispatchTimers, 0);
    assert.equal(result.blockedWhileNativePending, true);
    assert.equal(result.cancelledResult, 'AbortError');
    assert.deepEqual(result.order, ['second', 'third']);
    assert.ok(result.requests.some((x) => x.points?.[0] === 0.55));
    assert.ok(result.requests.some((x) => x.points?.[0] === 1));
    for (const x of result.results) {
      assert.equal(x.restore, '');
      assert.equal(x.error, '');
      assert.equal(x.stats.pending, false);
      assert.equal(x.stats.failed, false);
      assert.ok(Number(x.stats.completed) > 0);
    }
    assert.equal(result.requests.filter((x) => x.points).length, 3);
    assert.equal(
      new Set(result.requests.filter((x) => x.points).map((x) => x.key)).size,
      1,
      'same native appearance must not alias different contours',
    );
    assert.ok(
      boxes.ellipse.height / boxes.ellipse.width > 1.6,
      'ellipse must retain its real narrow contour',
    );
    assert.ok(
      boxes.triangle.width > boxes.ellipse.width * 1.25,
      'second contour must not reuse ellipse geometry',
    );
    assert.ok(
      Math.abs(boxes['ellipse-return'].width - boxes.ellipse.width) < 12,
      'returning contour must reuse correct geometry',
    );
    console.log(
      JSON.stringify(
        {
          contexts: result.contexts,
          sharedModules: result.retained.sharedModules,
          boxes,
          cleanup: result.after,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
