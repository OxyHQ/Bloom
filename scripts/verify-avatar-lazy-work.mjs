/** Exercises deferred activity loading through the actual public runtime controller. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { installAvatarPNGSnapshots } from './fixtures/avatar/png-snapshot.mjs';
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const origin = process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6006';
const built = process.env.AVATAR_BUILT_RUNTIME === '1';
const connected = Boolean(process.env.AVATAR_BROWSER_URL);
const browser = connected
  ? await puppeteer.connect({
      browserURL: process.env.AVATAR_BROWSER_URL,
      defaultViewport: null,
      protocolTimeout: 180000,
    })
  : await puppeteer.launch({
      executablePath: process.env.CHROME_PATH,
      headless: true,
      protocolTimeout: 180000,
      args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
    });
const ownedPages = [];
const report = { built, cases: [], presentations: [] };
try {
  for (const scenario of process.env.AVATAR_LAZY_CASES?.split(',') ?? [
    'noop-latest',
    'complete',
    'same-reference',
    'replace',
    'pause',
    'reduced',
    'dispose',
    'failure',
  ]) {
    const page = await browser.newPage();
    ownedPages.push(page);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewport({ width: 640, height: 480, deviceScaleFactor: 1 });
    const cdp = await page.createCDPSession();
    await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*avatar-lazy-work.html' }] });
    cdp.on('Fetch.requestPaused', (event) =>
      cdp.send('Fetch.fulfillRequest', {
        requestId: event.requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
        body: Buffer.from('<!doctype html><body style="margin:0;display:flex"></body>').toString(
          'base64',
        ),
      }),
    );
    await page.goto(`${origin}/avatar-lazy-work.html`);
    await cdp.send('Fetch.disable');
    await page.evaluate(installAvatarPNGSnapshots);
    await page.evaluate(
      async ({ built }) => {
        performance.setResourceTimingBufferSize(5000);
        window.workRequests = [];
        window.errors = 0;
        window.holdWork = false;
        window.failWork = false;
        const fetchOriginal = window.fetch;
        window.fetch = async (url, ...args) => {
          if (
            /\/@bloom-avatar-motion\/work\/|computer-geometry(?:-[^/]+)?\.(?:bin|json)(?:\?|$)|(?:packed|catalog)-motion-[^/]+-work-[^/]+\.bin/.test(
              String(url),
            )
          ) {
            workRequests.push(String(url));
            if (holdWork) await window.workGate;
            if (failWork) return new Response('Injected work fetch failure', { status: 503 });
          }
          return fetchOriginal(url, ...args);
        };
        const runtimeUrl = new URL(
          built ? '/bloom-character/runtime.mjs' : '/runtime/avatar-runtime.ts',
          location.href,
        ).href;
        if (built) {
          const { loadCharacterRuntime } = await import(
            '/src/agent-avatar/character-runtime-module.ts'
          );
          window.runtime = await loadCharacterRuntime(runtimeUrl);
        } else window.runtime = await import(runtimeUrl);
        const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
        window.resolveCharacter = resolveAvatarCharacter;
        if (built) {
          await runtime.diagnostics();
          const poolUrl = performance
            .getEntriesByType('resource')
            .map((entry) => entry.name)
            .find((url) => /\/chunks\/avatar-pool-[^/]+\.mjs(?:\?|$)/.test(url));
          if (!poolUrl) throw Error('Built loader did not fetch its actual pool module');
          window.pool = await import(poolUrl);
        } else {
          const source = await (await fetch(runtimeUrl)).text();
          window.pool = await import(
            new URL(source.match(/import\(["']([^"']*avatar-pool[^"']*)["']\)/)[1], runtimeUrl).href
          );
        }
        window.props = {
          character: resolveAvatarCharacter({ preset: 'blue_beret' }),
          reduced: false,
          interactive: true,
        };
        window.canvases = [];
        window.controllers = [];
        window.ready = 0;
        await Promise.all(
          [0, 1].map(async (index) => {
            const canvas = document.createElement('canvas');
            canvas.style.cssText = 'width:64px;height:64px';
            canvases[index] = canvas;
            document.body.append(canvas);
            controllers[index] = await runtime.createAvatar(canvas, props, {
              onReady: () => ready++,
              onError: () => window.errors++,
            });
          }),
        );
        window.diag = () => pool.editorPoolDiagnostics();
      },
      { built },
    );
    await page.waitForFunction(() => ready === 2 && diag()[0].stats.frames > 3, { timeout: 90000 });
    const presentations = await page.evaluate(() => diag().map((pool) => pool.presentation));
    report.presentations.push({ scenario, presentations });
    if (process.env.AVATAR_EXPECT_PRESENTER)
      assert(
        presentations.some((p) => p?.[`${process.env.AVATAR_EXPECT_PRESENTER}Frames`] > 0),
        'Requested backend must actually submit frames',
      );
    assert.equal(
      await page.evaluate(() => workRequests.length),
      0,
      'Idle never requests Computer payloads',
    );
    if (scenario === 'noop-latest') {
      assert.equal(
        await page.evaluate(async () => {
          const noop = controllers[0].update(props);
          const changed = controllers[0].update({ ...props, reactionKey: 1 });
          await Promise.all([noop, changed]);
          return diag()[0].stats.states[0].motion;
        }),
        'reaction',
        'A synchronous new intent after a no-op update is not dropped',
      );
      await page.evaluate(() => {
        controllers.forEach((controller) => {
          controller.dispose();
        });
      });
      await page.waitForFunction(() => diag().length === 0);
      assert.deepEqual(errors, []);
      report.cases.push(scenario);
      console.log(`Lazy Work: ${scenario} passed`);
      await page.close();
      continue;
    }
    const before = await page.evaluate(() => {
      window.holdWork = true;
      window.workGate = new Promise((resolve) => {
        window.releaseWork = resolve;
      });
      window.workProps = { ...props, workingKey: 1 };
      window.pendingWork = controllers[0].update(workProps);
      return { frames: diag()[0].stats.frames, neighborTime: diag()[0].stats.states[1].motionTime };
    });
    await page.waitForFunction(() => workRequests.length > 0);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const waiting = await page.evaluate(() => ({
      frames: diag()[0].stats.frames,
      motion: diag()[0].stats.states[0].motion,
      neighborTime: diag()[0].stats.states[1].motionTime,
    }));
    assert(waiting.frames > before.frames, 'Idle continues rendering during the held work fetch');
    assert.equal(waiting.motion, 'idle');
    assert(waiting.neighborTime > before.neighborTime, 'Neighbor keeps its clock');
    if (scenario === 'same-reference')
      await page.evaluate(() => {
        controllers[0].update(workProps);
      });
    if (scenario === 'replace') {
      await page.evaluate(() => {
        window.replacement = controllers[0].update({
          ...props,
          character: resolveCharacter({ preset: 'alfred' }),
        });
      });
      await page.waitForFunction(() => diag()[0].stats.states[0].preset === 'alfred', {
        timeout: 10000,
      });
    }
    if (scenario === 'dispose') await page.evaluate(() => controllers[0].dispose());
    if (scenario === 'pause' || scenario === 'reduced') {
      await page.evaluate((scenario) => {
        window.replacement = controllers[0].update({
          ...props,
          [scenario === 'pause' ? 'paused' : 'reduced']: true,
        });
      }, scenario);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const frozenPicture = await page.evaluate(() => avatarPNGSnapshot(canvases[0]));
      await new Promise((resolve) => setTimeout(resolve, 300));
      assert.deepEqual(
        await page.evaluate(() => avatarPNGSnapshot(canvases[0])),
        frozenPicture,
        'Pause/reduced applies before the pending fetch completes',
      );
    }
    if (scenario === 'failure')
      await page.evaluate(() => {
        window.failWork = true;
      });
    const released = await page.evaluate(async () => {
      window.holdWork = false;
      releaseWork();
      await pendingWork;
      if (window.replacement) await replacement;
      return { diagnostics: diag(), errors, workRequests: [...workRequests] };
    });
    if (scenario === 'complete' || scenario === 'same-reference') {
      const state = released.diagnostics[0].stats.states[0];
      assert.equal(state.motion, 'work');
      assert(state.motionTime < 0.1, 'Loading delay does not consume the first Work presentation');
      await page.waitForFunction(() => diag()[0].stats.states[0].motionTime > 0.15);
      const requests = released.workRequests.length;
      await page.evaluate(() => controllers[0].update({ ...props, workingKey: 2 }));
      assert.equal(
        await page.evaluate(() => workRequests.length),
        requests,
        'Warm repeat reuses activity payloads',
      );
      assert.equal(released.errors, 0);
    } else if (scenario === 'pause' || scenario === 'reduced') {
      assert.equal(released.diagnostics[0].stats.states[0].motion, 'idle');
      assert.equal(released.errors, 0);
    } else if (scenario === 'replace') {
      assert.equal(released.diagnostics[0].stats.states[0].preset, 'alfred');
      assert.equal(released.diagnostics[0].stats.states[0].motion, 'idle');
      assert.equal(released.errors, 0);
    } else {
      assert.equal(released.diagnostics.length, 1);
      assert.equal(
        released.diagnostics[0].avatars,
        1,
        'Pending completion preserves the surviving neighbor',
      );
      assert.equal(released.errors, scenario === 'failure' ? 1 : 0);
    }
    await page.evaluate(() => {
      controllers.forEach((c) => {
        c.dispose();
      });
      canvases.forEach((c) => {
        c.remove();
      });
    });
    assert.deepEqual(await page.evaluate(() => diag()), []);
    assert.deepEqual(errors, []);
    report.cases.push(scenario);
    console.log(`Lazy Work: ${scenario} passed`);
    await page.close();
  }
} catch (error) {
  report.failure = String(error.stack || error);
  throw error;
} finally {
  await mkdir('.local/avatar-lazy-work', { recursive: true });
  await writeFile('.local/avatar-lazy-work/report.json', `${JSON.stringify(report, null, 2)}\n`);
  for (const page of ownedPages) if (!page.isClosed()) await page.close();
  if (connected) await browser.disconnect();
  else await browser.close();
}
