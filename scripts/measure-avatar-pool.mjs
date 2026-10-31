/** Measures the production avatar pool without substituting its assets or renderer. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { installAvatarPNGSnapshots } from './fixtures/avatar/png-snapshot.mjs';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const origin = process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6006';
const output = process.env.AVATAR_POOL_OUTPUT || '.local/avatar-pool-measurement';
const counts = (process.env.AVATAR_POOL_COUNTS || '1,24').split(',').map(Number);
const modes = (process.env.AVATAR_POOL_MODES || 'active,one-active,offscreen,paused').split(',');
const presetMode = process.env.AVATAR_POOL_PRESETS || 'blue';
const diagnostic = process.env.AVATAR_DIAGNOSTIC || '';
const gpuProfile = process.env.AVATAR_GPU_PROFILE || '';
const size = Number(process.env.AVATAR_POOL_SIZE || 112);
const dpr = Number(process.env.AVATAR_POOL_DPR || 1);
const duration = Number(process.env.AVATAR_SAMPLE_MS || 5000);
const warmup = Number(process.env.AVATAR_WARMUP_MS || 5000);
const browser = process.env.AVATAR_BROWSER_URL
  ? await puppeteer.connect({ browserURL: process.env.AVATAR_BROWSER_URL, protocolTimeout: 180000 })
  : await puppeteer.launch({
      executablePath: process.env.CHROME_PATH,
      headless: true,
      protocolTimeout: 180000,
      args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
    });
const ownedPages = [];
const report = {
  conditions: {
    origin,
    size,
    dpr,
    gpuProfile,
    cpuProfile: process.env.AVATAR_CPU_PROFILE === '1',
    duration,
    warmup,
    presetMode,
    diagnostic,
    hideStrands: process.env.AVATAR_HIDE_STRANDS === '1',
    bitmapCopy: process.env.AVATAR_BITMAP_COPY === '1',
    throttle: Number(process.env.AVATAR_CPU_THROTTLE || 1),
    caveat:
      'Browser diagnostic; CPU throttling is not a physical low-end device. GPU identity below. No quality or frame-budget changes.',
  },
  cases: [],
};
await mkdir(output, { recursive: true });
try {
  report.gpu = (await (await browser.target().createCDPSession()).send('SystemInfo.getInfo')).gpu;
  for (const count of counts) {
    const page = await browser.newPage();
    ownedPages.push(page);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.location().url?.endsWith('/favicon.ico'))
        errors.push(message.text());
    });
    await page.setViewport({
      width: Math.max(1200, 8 * size + 32),
      height: Math.max(800, Math.ceil(count / 8) * size + 32),
      deviceScaleFactor: dpr,
    });
    const cdp = await page.createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: report.conditions.throttle });
    await cdp.send('Performance.enable');
    await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*avatar-pool-measure.html' }] });
    cdp.on('Fetch.requestPaused', (event) =>
      cdp.send('Fetch.fulfillRequest', {
        requestId: event.requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
        body: Buffer.from(
          '<!doctype html><body style="margin:16px;background:#f5f5f2"><main style="display:flex;flex-wrap:wrap;width:896px"></main></body>',
        ).toString('base64'),
      }),
    );
    await page.evaluateOnNewDocument(
      ({ bitmapCopy, diagnostic }) => {
        performance.setResourceTimingBufferSize(10000);
        window.audit = {
          copies: 0,
          copyMs: 0,
          bitmaps: 0,
          rectReads: 0,
          uploads: 0,
          uploadBytes: 0,
          draws: 0,
          contexts: 0,
          lost: 0,
          active: false,
          intervals: [],
          globalRafIntervals: [],
          globalRafFrames: 0,
          last: new Map(),
        };
        let lastRaf = 0;
        const observeRaf = (time) => {
          if (audit.active) {
            audit.globalRafFrames++;
            if (lastRaf) audit.globalRafIntervals.push(time - lastRaf);
          }
          lastRaf = time;
          requestAnimationFrame(observeRaf);
        };
        requestAnimationFrame(observeRaf);
        const rect = HTMLCanvasElement.prototype.getBoundingClientRect;
        HTMLCanvasElement.prototype.getBoundingClientRect = function (...args) {
          if (audit.active) audit.rectReads++;
          return rect.apply(this, args);
        };
        const draw = CanvasRenderingContext2D.prototype.drawImage;
        const pending = new Map();
        const presented = (context, args) => {
          const started = performance.now();
          draw.apply(context, args);
          if (audit.active && args[0]?.dataset?.avatarRenderer) {
            audit.copyMs += performance.now() - started;
            audit.copies++;
            const now = performance.now(),
              previous = audit.last.get(context.canvas);
            if (previous !== undefined && context.canvas.dataset.index === '0')
              audit.intervals.push(now - previous);
            audit.last.set(context.canvas, now);
          }
        };
        CanvasRenderingContext2D.prototype.drawImage = function (...args) {
          const source = args[0];
          if (bitmapCopy && source?.dataset?.avatarRenderer) {
            let frame = pending.get(source);
            if (!frame) {
              frame = { calls: [], bitmap: createImageBitmap(source) };
              pending.set(source, frame);
              if (audit.active) audit.bitmaps++;
              queueMicrotask(() => {
                pending.delete(source);
                frame.bitmap.then((bitmap) => {
                  bitmap.dataset = source.dataset;
                  for (const [context, args] of frame.calls)
                    presented(context, [bitmap, ...args.slice(1)]);
                  bitmap.close();
                });
              });
            }
            frame.calls.push([this, args]);
          } else presented(this, args);
        };
        const get = HTMLCanvasElement.prototype.getContext;
        const seen = new WeakSet();
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          if (/^webgl/.test(type) && diagnostic.includes('canvasaa0'))
            args[0] = { ...args[0], antialias: false };
          const gl = get.call(this, type, ...args);
          if (gl && /^webgl/.test(type) && !seen.has(gl)) {
            seen.add(gl);
            audit.contexts++;
            this.addEventListener('webglcontextlost', () => audit.lost++);
            for (const name of ['texSubImage2D', 'texImage2D', 'bufferSubData', 'bufferData']) {
              const fn = gl[name];
              gl[name] = function (...args) {
                if (audit.active) {
                  audit.uploads++;
                  const at = args.findIndex((arg) => ArrayBuffer.isView(arg));
                  const data = args[at];
                  if (data) {
                    const offset = Number(args[at + 1]) || 0;
                    let elements =
                      name.startsWith('buffer') && args[at + 2]
                        ? args[at + 2]
                        : data.length - offset;
                    if (name === 'texSubImage2D' && at === 8) {
                      const components =
                        args[6] === gl.RGBA
                          ? 4
                          : args[6] === gl.RGB
                            ? 3
                            : args[6] === gl.RG
                              ? 2
                              : 1;
                      elements = Math.min(elements, args[4] * args[5] * components);
                    }
                    if (name === 'texImage2D' && at === 8) {
                      const components =
                        args[6] === gl.RGBA
                          ? 4
                          : args[6] === gl.RGB
                            ? 3
                            : args[6] === gl.RG
                              ? 2
                              : 1;
                      elements = Math.min(elements, args[3] * args[4] * components);
                    }
                    audit.uploadBytes += elements * data.BYTES_PER_ELEMENT;
                  }
                }
                return fn.apply(this, args);
              };
            }
            for (const name of [
              'drawElements',
              'drawArrays',
              'drawElementsInstanced',
              'drawArraysInstanced',
            ]) {
              const fn = gl[name];
              gl[name] = function (...args) {
                if (audit.active) audit.draws++;
                return fn.apply(this, args);
              };
            }
          }
          return gl;
        };
      },
      { bitmapCopy: report.conditions.bitmapCopy, diagnostic },
    );
    await page.goto(`${origin}/avatar-pool-measure.html`);
    await cdp.send('Fetch.disable');
    await page.evaluate(installAvatarPNGSnapshots);
    const start = performance.now();
    await page.evaluate(
      async ({ count, presetMode, hideStrands, diagnostic, gpuProfile, size }) => {
        window.runtime = await import('/runtime/avatar-runtime.ts');
        const source = await (await fetch('/runtime/avatar-runtime.ts')).text();
        const poolUrl = source.match(/import\(["']([^"']*avatar-pool[^"']*)["']\)/)[1];
        const poolSource = await (await fetch(poolUrl)).text();
        const engineUrl = poolSource.match(/from ["']([^"']*authored-engine[^"']*)["']/)[1];
        window.diagnosticApplications = 0;
        window.gpuSamples = [];
        window.gpuDisjointSamples = 0;
        if (hideStrands || diagnostic || gpuProfile) {
          const { AuthoredAvatarEngine } = await import(engineUrl);
          const material = AuthoredAvatarEngine.prototype.material;
          AuthoredAvatarEngine.prototype.material = function (part, ...rest) {
            diagnosticApplications++;
            const result = material.call(this, part, ...rest);
            if (gpuProfile && !this.profileInstalled) {
              this.profileInstalled = true;
              const renderer = this.renderer,
                gl = renderer.getContext();
              const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
              if (!ext)
                throw Error('GPU timer extension unavailable; cannot infer GPU times from CPU');
              const pending = [];
              let inQuery = false;
              const collect = () => {
                if (gl.getParameter(ext.GPU_DISJOINT_EXT)) {
                  gpuDisjointSamples += pending.length;
                  pending.splice(0).forEach(({ query }) => {
                    gl.deleteQuery(query);
                  });
                  return;
                }
                while (
                  pending.length &&
                  gl.getQueryParameter(pending[0].query, gl.QUERY_RESULT_AVAILABLE)
                ) {
                  const { query, label, record } = pending.shift();
                  const milliseconds = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6;
                  if (record) gpuSamples.push({ label, milliseconds });
                  gl.deleteQuery(query);
                }
              };
              window.collectGpu = collect;
              const measured = (label, call) => {
                if (inQuery) return call();
                collect();
                const query = gl.createQuery(),
                  record = audit.active;
                inQuery = true;
                gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
                try {
                  return call();
                } finally {
                  gl.endQuery(ext.TIME_ELAPSED_EXT);
                  inQuery = false;
                  pending.push({ query, label, record });
                }
              };
              if (gpuProfile === 'resolve') {
                const blit = gl.blitFramebuffer;
                gl.blitFramebuffer = (...args) =>
                  measured('MSAA-color-resolve', () => blit.apply(gl, args));
              } else {
                const render = renderer.render;
                renderer.render = (...args) => {
                  const target = renderer.getRenderTarget();
                  const label =
                    target === this.depthTarget
                      ? 'depth'
                      : target === this.colorTarget
                        ? 'color-including-resolve'
                        : target === this.occlusion.sampled
                          ? 'AO-sample'
                          : target === this.occlusion.resolved
                            ? 'AO-resolve'
                            : target === null
                              ? 'present'
                              : 'other';
                  return measured(label, () => render.apply(renderer, args));
                };
              }
            }
            if (hideStrands && part.fur) result.visible = false;
            if (diagnostic.includes('msaa0')) this.colorTarget.samples = 0;
            if (diagnostic.includes('noresolve')) this.colorTarget.resolveDepthBuffer = false;
            if (diagnostic.includes('noao') && !this.diagnosticOcclusion) {
              this.diagnosticOcclusion = true;
              const renderer = this.renderer,
                depth = this.depthTarget,
                render = renderer.render;
              renderer.render = (...args) => {
                if (renderer.getRenderTarget() !== depth) return render.apply(renderer, args);
              };
              this.occlusion.render = () => null;
            }
            if (diagnostic.includes('noao')) result.uniforms.f.value.effects.y = 0;
            if (diagnostic.includes('novlight')) {
              result.vertexShader = result.vertexShader
                .replace(/furLight=.*worldPosition,1\.\);/g, 'furLight=vec4(0.);')
                .replace(/furArea[012]=[^;]+;/g, (match) => `${match.slice(0, 8)}=vec4(0.);`);
            }
            if (
              diagnostic.includes('flatall') ||
              (diagnostic.includes('flatbody') && part.kind === 1 && !part.fur)
            ) {
              result.fragmentShader =
                'precision highp float; in vec3 worldNormal,pigment; flat in vec4 avatarColorRoughness; out vec4 outputColor; void main(){float light=.65+.35*max(dot(normalize(worldNormal),normalize(vec3(-1.,1.,1.))),0.); outputColor=vec4(avatarColorRoughness.rgb*pigment*light,1.);}';
            }
            return result;
          };
        }
        const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
        window.pool = await import(poolUrl);
        window.canvases = [];
        window.controllers = [];
        window.props = [];
        window.ready = 0;
        document.querySelector('main').style.width = `${8 * size}px`;
        await Promise.all(
          Array.from({ length: count }, async (_, index) => {
            const canvas = document.createElement('canvas');
            canvas.dataset.index = index;
            canvas.style.cssText = `width:${size}px;height:${size}px;display:block`;
            document.querySelector('main').append(canvas);
            canvases[index] = canvas;
            const presets = [
              'blue_beret',
              'alfred',
              'purple_heart',
              'lime_frog',
              'coral_monocle',
              'gus',
              'blue_spectacles',
              'lime_headphones',
            ];
            props[index] = {
              character: resolveAvatarCharacter({
                preset: presetMode === 'mixed' ? presets[index % presets.length] : 'blue_beret',
                ...(presetMode === 'custom' ? { accessory: 'none' } : {}),
                bodyColor: `#${(0x46719b + index * 10007).toString(16).padStart(6, '0')}`,
              }),
              reduced: false,
              interactive: true,
            };
            controllers[index] = await runtime.createAvatar(canvas, props[index], {
              onReady: () => ready++,
              onError: () => {
                throw Error('Runtime unavailable');
              },
            });
          }),
        );
      },
      {
        count,
        presetMode,
        hideStrands: report.conditions.hideStrands,
        diagnostic,
        gpuProfile,
        size,
      },
    );
    await page.waitForFunction((count) => ready === count, { timeout: 120000 }, count);
    if (diagnostic || report.conditions.hideStrands)
      assert(
        (await page.evaluate(() => diagnosticApplications)) > 0,
        'Diagnostic patches the actual production module, including its HMR query identity',
      );
    const readyMilliseconds = performance.now() - start;
    await page.screenshot({ path: `${output}/avatars-${count}.png` });
    for (const mode of modes) {
      await page.evaluate(async (mode) => {
        for (let i = 0; i < controllers.length; i++) {
          canvases[i].style.position = mode === 'offscreen' && i > 0 ? 'fixed' : '';
          canvases[i].style.top = mode === 'offscreen' && i > 0 ? '20000px' : '';
          await controllers[i].update({
            ...props[i],
            paused: mode === 'paused' || (mode === 'one-active' && i > 0),
          });
        }
      }, mode);
      await new Promise((r) => setTimeout(r, warmup));
      const metrics = async () =>
        Object.fromEntries(
          (await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [
            name,
            value,
          ]),
        );
      const beforeMetrics = await metrics();
      if (report.conditions.cpuProfile) {
        await cdp.send('Profiler.enable');
        await cdp.send('Profiler.setSamplingInterval', { interval: 1000 });
        await cdp.send('Profiler.start');
      }
      const before = await page.evaluate(() => {
        window.gpuSamples = [];
        Object.assign(audit, {
          copies: 0,
          copyMs: 0,
          bitmaps: 0,
          rectReads: 0,
          uploads: 0,
          uploadBytes: 0,
          draws: 0,
          active: true,
          intervals: [],
          globalRafIntervals: [],
          globalRafFrames: 0,
          last: new Map(),
        });
        return { time: performance.now(), pools: pool.editorPoolDiagnostics() };
      });
      await new Promise((r) => setTimeout(r, duration));
      const after = await page.evaluate(() => {
        audit.active = false;
        window.collectGpu?.();
        const gl = document.querySelector('[data-avatar-renderer]').getContext('webgl2');
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        return {
          time: performance.now(),
          pools: pool.editorPoolDiagnostics(),
          audit: { ...audit, last: undefined },
          renderer: gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
          contextAttributes: gl.getContextAttributes(),
          gpuTimerSupported: !!gl.getExtension('EXT_disjoint_timer_query_webgl2'),
          gpuSamples,
          gpuDisjointSamples,
          network: performance.getEntriesByType('resource').reduce(
            (s, e) => ({
              requests: s.requests + 1,
              decodedBytes: s.decodedBytes + e.decodedBodySize,
              transferBytes: s.transferBytes + e.transferSize,
            }),
            { requests: 0, decodedBytes: 0, transferBytes: 0 },
          ),
        };
      });
      const afterMetrics = await metrics();
      let cpuProfile;
      if (report.conditions.cpuProfile) {
        const { profile } = await cdp.send('Profiler.stop');
        await writeFile(`${output}/cpu-${count}-${mode}.cpuprofile`, JSON.stringify(profile));
        const nodes = new Map(profile.nodes.map((node) => [node.id, node]));
        const times = new Map();
        profile.samples.forEach((id, index) => {
          times.set(id, (times.get(id) || 0) + profile.timeDeltas[index]);
        });
        cpuProfile = [...times]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 25)
          .map(([id, microseconds]) => ({
            function: nodes.get(id).callFrame.functionName,
            url: nodes.get(id).callFrame.url,
            line: nodes.get(id).callFrame.lineNumber + 1,
            sampledSelfMs: microseconds / 1000,
          }));
      }
      const frames =
        after.pools.reduce((s, p) => s + p.stats.frames, 0) -
        before.pools.reduce((s, p) => s + p.stats.frames, 0);
      const intervals = after.audit.intervals.sort((a, b) => a - b);
      const rafIntervals = after.audit.globalRafIntervals.sort((a, b) => a - b);
      const summary = {
        count,
        mode,
        readyMilliseconds,
        elapsedMs: after.time - before.time,
        frames,
        fps: frames / ((after.time - before.time) / 1000),
        globalRaf: {
          frames: after.audit.globalRafFrames,
          perSecond: (after.audit.globalRafFrames * 1000) / (after.time - before.time),
          medianGapMs: rafIntervals[Math.floor(rafIntervals.length / 2)] ?? null,
          p95GapMs: rafIntervals[Math.floor(rafIntervals.length * 0.95)] ?? null,
        },
        mainThreadMs: (afterMetrics.TaskDuration - beforeMetrics.TaskDuration) * 1000,
        scriptMs: (afterMetrics.ScriptDuration - beforeMetrics.ScriptDuration) * 1000,
        cpuProfile,
        heapBytes: afterMetrics.JSHeapUsedSize,
        renderer: after.renderer,
        contextAttributes: after.contextAttributes,
        gpuTimerSupported: after.gpuTimerSupported,
        gpuDisjointSamples: after.gpuDisjointSamples,
        gpuTiming: Object.fromEntries(
          [...new Set(after.gpuSamples.map((s) => s.label))].map((label) => {
            const values = after.gpuSamples
              .filter((s) => s.label === label)
              .map((s) => s.milliseconds)
              .sort((a, b) => a - b);
            return [
              label,
              {
                samples: values.length,
                meanMs: values.reduce((s, v) => s + v, 0) / values.length,
                medianMs: values[Math.floor(values.length / 2)],
                p95Ms: values[Math.floor(values.length * 0.95)],
              },
            ];
          }),
        ),
        network: after.network,
        audit: { ...after.audit, intervals: undefined, globalRafIntervals: undefined },
        presentationGapP95: intervals[Math.floor(intervals.length * 0.95)] ?? null,
        pools: after.pools.map(({ stats, ...p }) => ({
          ...p,
          stats: { ...stats, states: undefined },
        })),
      };
      if (mode === 'paused') assert.equal(frames, 0, 'Paused production scene submits no frames');
      else assert(frames > 0, 'Active production scene advances');
      report.cases.push(summary);
      assert.deepEqual(errors, [], 'No browser or shader errors during measurement');
      console.log(
        JSON.stringify({
          count,
          mode,
          fps: summary.fps,
          globalRaf: {
            frames: after.audit.globalRafFrames,
            perSecond: (after.audit.globalRafFrames * 1000) / (after.time - before.time),
            medianGapMs: rafIntervals[Math.floor(rafIntervals.length / 2)] ?? null,
            p95GapMs: rafIntervals[Math.floor(rafIntervals.length * 0.95)] ?? null,
          },
          mainThreadMs: summary.mainThreadMs,
          copies: summary.audit.copies,
          rectReads: summary.audit.rectReads,
          triangles: summary.pools[0].stats.triangles,
        }),
      );
      await writeFile(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
    }
    const pictures = await page.evaluate(() => avatarPNGSnapshots(canvases));
    assert.equal(pictures.length, count, 'Every avatar has a nonblank decoded PNG');
    report.cases.at(-1).paintedPNGs = pictures;
    await page.evaluate(() => {
      controllers.forEach((c) => {
        c.dispose();
      });
      canvases.forEach((c) => {
        c.remove();
      });
    });
    await new Promise((r) => setTimeout(r, 100));
    const cleanup = await page.evaluate(() => ({
      pools: pool.editorPoolDiagnostics().length,
      contexts: audit.contexts,
      lost: audit.lost,
    }));
    assert.equal(cleanup.pools, 0);
    assert.equal(cleanup.contexts, cleanup.lost);
    assert.deepEqual(errors, []);
    report.cases.at(-1).cleanup = cleanup;
    await page.close();
  }
} catch (error) {
  report.failure = String(error.stack || error);
  throw error;
} finally {
  await writeFile(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
  for (const page of ownedPages) if (!page.isClosed()) await page.close();
  if (process.env.AVATAR_KEEP_BROWSER === '1') browser.disconnect();
  else await browser.close();
}
