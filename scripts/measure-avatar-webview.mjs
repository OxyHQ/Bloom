/** Runs against a dedicated Android WebView target. Never closes the browser or other targets. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const debug = process.env.AVATAR_WEBVIEW_DEBUG || 'http://localhost:9340';
const output = process.env.AVATAR_WEBVIEW_OUTPUT || '.local/avatar-webview';
const fixtureUrl =
  process.env.AVATAR_WEBVIEW_FIXTURE_URL ||
  new URL(
    `/@fs${resolve('scripts/fixtures/avatar/native-benchmark.html')}`,
    'http://127.0.0.1:6008',
  ).href;
const targets = await (await fetch(`${debug}/json`)).json();
const target = targets.find((t) => t.type === 'page' && /native-benchmark\.html/.test(t.url));
assert(target, 'Dedicated Bloom benchmark WebView target must already be open');
const endpoint = new URL(target.webSocketDebuggerUrl);
endpoint.host = new URL(debug).host;
const socket = new WebSocket(endpoint);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let nextId = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('close', () => {
  for (const call of pending.values()) {
    clearTimeout(call.timeout);
    call.reject(new Error('Dedicated WebView target closed during the test'));
  }
  pending.clear();
});
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const call = pending.get(message.id);
    if (!call) return;
    pending.delete(message.id);
    clearTimeout(call.timeout);
    if (message.error) call.reject(new Error(JSON.stringify(message.error)));
    else call.resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown')
    errors.push(message.params.exceptionDetails);
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 180000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (fn, args) => {
  const result = await send('Runtime.evaluate', {
    expression: `(${fn})(${JSON.stringify(args)})`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const report = {
  conditions:
    'Physical Android WebView, real viewport/DPR. Not React Native compositor verification. No CPU/GPU emulation.',
  cases: [],
};
await mkdir(output, { recursive: true });
try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Performance.enable');
  const metrics = async () =>
    Object.fromEntries(
      (await send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]),
    );
  const origins = (
    process.env.AVATAR_WEBVIEW_ORIGINS || 'http://127.0.0.1:6008,http://127.0.0.1:6007'
  ).split(',');
  for (const origin of origins)
    for (const count of (process.env.AVATAR_WEBVIEW_COUNTS || '1,12').split(',').map(Number)) {
      await send('Page.navigate', {
        url: fixtureUrl,
      });
      await wait(1000);
      const initial = await evaluate(
        async ({ origin, count }) => {
          if (document.hidden) throw Error('The physical WebView must be visible and unlocked');
          document.querySelector('main').replaceChildren();
          window.runtime = await import(`${origin}/runtime/avatar-runtime.ts`);
          const { resolveAvatarCharacter } = await import(
            `${origin}/src/agent-avatar/character.ts`
          );
          const source = await (await fetch(`${origin}/runtime/avatar-runtime.ts`)).text();
          window.pool = await import(
            new URL(source.match(/import\(["']([^"']*avatar-pool[^"']*)["']\)/)[1], origin).href
          );
          window.canvases = [];
          window.controllers = [];
          window.props = [];
          window.ready = 0;
          window.copies = 0;
          window.gaps = [];
          window.copyLast = 0;
          window.measuring = false;
          const draw = CanvasRenderingContext2D.prototype.drawImage;
          CanvasRenderingContext2D.prototype.drawImage = function (...args) {
            const result = draw.apply(this, args);
            if (measuring && this.canvas === canvases[0]) {
              const now = performance.now();
              if (copyLast) gaps.push(now - copyLast);
              copyLast = now;
              copies++;
            }
            return result;
          };
          const started = performance.now();
          await Promise.all(
            Array.from({ length: count }, async (_, index) => {
              const canvas = document.createElement('canvas');
              document.querySelector('main').append(canvas);
              canvases[index] = canvas;
              props[index] = {
                character: resolveAvatarCharacter({
                  preset: 'blue_beret',
                  bodyColor: `#${(0x46719b + index * 10007).toString(16).padStart(6, '0')}`,
                }),
                reduced: false,
                interactive: true,
              };
              controllers[index] = await runtime.createAvatar(canvas, props[index], {
                onReady: () => ready++,
                onError: () => {
                  throw Error('Unavailable avatar');
                },
              });
            }),
          );
          while (ready !== count) await new Promise((r) => setTimeout(r, 50));
          const gl = document.querySelector('[data-avatar-renderer]').getContext('webgl2');
          const ext = gl.getExtension('WEBGL_debug_renderer_info');
          return {
            readyMs: performance.now() - started,
            userAgent: navigator.userAgent,
            renderer: gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
            viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
            count,
            gpuTimerSupported: !!gl.getExtension('EXT_disjoint_timer_query_webgl2'),
          };
        },
        { origin, count },
      );
      for (const mode of ['active', 'one-active', 'paused']) {
        await evaluate(async (mode) => {
          for (let i = 0; i < controllers.length; i++)
            await controllers[i].update({
              ...props[i],
              paused: mode === 'paused' || (mode === 'one-active' && i > 0),
            });
        }, mode);
        await wait(5000);
        const beforeMetrics = await metrics();
        const before = await evaluate(() => {
          copies = 0;
          gaps = [];
          copyLast = 0;
          measuring = true;
          return {
            time: performance.now(),
            frames: pool.editorPoolDiagnostics().reduce((n, p) => n + p.stats.frames, 0),
          };
        });
        await wait(5000);
        const after = await evaluate(() => {
          measuring = false;
          const pools = pool.editorPoolDiagnostics();
          return {
            time: performance.now(),
            frames: pools.reduce((n, p) => n + p.stats.frames, 0),
            pools: pools.map(({ stats, ...p }) => ({
              ...p,
              stats: { ...stats, states: undefined },
            })),
            copies,
            gaps,
            hidden: document.hidden,
            visible: canvases.filter((c) => {
              const r = c.getBoundingClientRect();
              return r.top < innerHeight && r.bottom > 0;
            }).length,
          };
        });
        const afterMetrics = await metrics();
        assert.equal(after.hidden, false, 'WebView stays visible');
        const frames = after.frames - before.frames,
          seconds = (after.time - before.time) / 1000;
        if (mode === 'paused') assert.equal(frames, 0);
        else assert(frames > 0);
        const sorted = after.gaps.sort((a, b) => a - b);
        const result = {
          origin,
          ...initial,
          mode,
          elapsedMs: seconds * 1000,
          frames,
          fps: frames / seconds,
          presentations: after.copies,
          presentationGapP95: sorted[Math.floor(sorted.length * 0.95)] ?? null,
          mainThreadMs: (afterMetrics.TaskDuration - beforeMetrics.TaskDuration) * 1000,
          visible: after.visible,
          pools: after.pools,
        };
        report.cases.push(result);
        console.log(
          JSON.stringify({
            origin,
            count,
            mode,
            fps: result.fps,
            mainThreadMs: result.mainThreadMs,
            renderer: result.renderer,
            visible: result.visible,
          }),
        );
        await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
      }
      // Android WebView may leave Page.captureScreenshot pending indefinitely.
      // Capture the dedicated host externally with adb exec-out screencap instead.
      await evaluate(() => {
        controllers.forEach((c) => c.dispose());
        if (pool.editorPoolDiagnostics().length) throw Error('Pool leak');
      });
      assert.deepEqual(errors, []);
    }
} catch (error) {
  report.failure = String(error.stack || error);
  throw error;
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
  socket.close();
}
