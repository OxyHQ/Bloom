/** Physical diagnostic fixture. Timing canvases must never be read with getImageData/toDataURL. */
import { resolve } from 'node:path';
import { send, evaluate, wait, socket } from './fixtures/avatar/physical-web/cdp.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
const output = process.env.AVATAR_OUTPUT || '.local/avatar-physical-web';
await mkdir(output, { recursive: true });
const count = Number(process.env.COUNT || 24),
  kind = process.env.KIND || 'authored',
  origin = process.env.ORIGIN || 'http://127.0.0.1:6007',
  size = Number(process.env.SIZE || 96),
  id = process.env.ID || `${origin.endsWith('6007') ? 'candidate' : 'baseline'}-${kind}-${count}`;
const fixture =
  process.env.AVATAR_FIXTURE_URL ||
  new URL(`/@fs${resolve('scripts/fixtures/avatar/native-benchmark.html')}`, origin).href;
await send('Page.enable');
await send('Page.navigate', { url: fixture });
await wait(700);
const initial = await evaluate(
  async ({ origin, count, kind, size, compact }) => {
    performance.setResourceTimingBufferSize(10000);
    document.body.style.margin = compact ? '4px' : '8px';
    const main = document.querySelector('main');
    main.style.gap = compact ? '4px' : '8px';
    window.auditRenderers = [];
    window.__THREE_DEVTOOLS__ = {
      dispatchEvent(e) {
        if (e.type === 'observe' && e.detail?.render && e.detail?.getContext)
          auditRenderers.push(e.detail);
      },
    };
    const started = performance.now(),
      url = `${origin}/bloom-character/runtime.mjs`;
    await import(url);
    window.runtime = globalThis[Symbol.for('bloom.character.runtimes')].get(url);
    if (!runtime) throw Error('Missing registered runtime');
    const { resolveAvatarCharacter } = await import(`${origin}/src/agent-avatar/character.ts`);
    const authored = [
      'blue_beret',
      'alfred',
      'purple_heart',
      'lime_frog',
      'coral_monocle',
      'gus',
      'blue_spectacles',
      'lime_headphones',
    ];
    const catalog = [
      { shape: 'heart', eyes: 'cyclops', accessory: 'crown' },
      { shape: 'six_lobed_flower', eyes: 'todd', eyewear: 'monocle' },
      { shape: 'cloud', eyes: 'oval' },
      { shape: 'clippo', eyes: 'clippo', accessory: 'bow' },
    ];
    window.canvases = [];
    window.controllers = [];
    window.props = [];
    window.ready = 0;
    window.avatarErrors = [];
    for (let i = 0; i < count; i++) {
      const c = document.createElement('canvas');
      c.style.width = c.style.height = `${size}px`;
      main.append(c);
      canvases.push(c);
      const spec =
        kind === 'blue'
          ? { preset: 'blue_beret' }
          : kind === 'catalog'
            ? { eyewear: 'none', accessory: 'none', ...catalog[i % 4] }
            : { preset: authored[i % 8] };
      props.push({
        character: resolveAvatarCharacter({
          ...spec,
          bodyColor: `#${(0x46719b + i * 10007).toString(16).padStart(6, '0')}`,
        }),
        reduced: false,
        interactive: true,
      });
      controllers.push(
        await runtime.createAvatar(c, props[i], {
          onReady: () => ready++,
          onError: (e) => avatarErrors.push(String(e)),
        }),
      );
    }
    const until = performance.now() + 90000;
    while (
      ready <
        Math.min(
          count,
          canvases.filter((c) => c.getBoundingClientRect().top < innerHeight).length,
        ) &&
      performance.now() < until
    )
      await new Promise((r) => setTimeout(r, 50));
    window.audit = { measuring: false, raf: [], copies: [], long: [] };
    let prev = 0;
    function raf(t) {
      if (audit.measuring && prev) audit.raf.push(t - prev);
      prev = t;
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      const start = performance.now();
      const result = draw.apply(this, args);
      if (audit.measuring)
        audit.copies.push({
          at: start,
          duration: performance.now() - start,
          canvas: canvases.indexOf(this.canvas),
        });
      return result;
    };
    new PerformanceObserver((list) => {
      if (audit.measuring)
        audit.long.push(
          ...list.getEntries().map((x) => ({ at: x.startTime, duration: x.duration })),
        );
    }).observe({ entryTypes: ['longtask'] });
    window.auditRead = async () => {
      const ds = await runtime.diagnostics();
      const gl = document.querySelector('[data-avatar-renderer]').getContext('webgl2');
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        time: performance.now(),
        ready,
        errors: avatarErrors,
        hidden: document.hidden,
        viewport: [innerWidth, innerHeight, devicePixelRatio],
        visible: canvases.filter((c) => {
          const r = c.getBoundingClientRect();
          return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
        }).length,
        renderer: gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
        gpuTimer: !!gl.getExtension('EXT_disjoint_timer_query_webgl2'),
        pools: ds.map(({ stats, ...p }) => ({ ...p, stats: { ...stats, states: undefined } })),
      };
    };
    return { readyMs: performance.now() - started, ...(await auditRead()) };
  },
  { origin, count, kind, size, compact: !!process.env.COMPACT },
);
if (process.env.SETUP_ONLY) {
  console.log(JSON.stringify(initial));
  socket.close();
  process.exit(0);
}
await wait(5000);
await send('Performance.enable');
await send('Profiler.enable');
await send('Profiler.setSamplingInterval', { interval: 1000 });
const before = await evaluate(async () => {
  audit.measuring = true;
  return await auditRead();
});
const mb = await send('Performance.getMetrics');
await send('Profiler.start');
await wait(5000);
const profile = await send('Profiler.stop');
const ma = await send('Performance.getMetrics');
const after = await evaluate(async () => {
  audit.measuring = false;
  return { ...(await auditRead()), measurements: audit };
});
const steadyBefore = await evaluate(async () => {
  audit.raf = [];
  audit.copies = [];
  audit.long = [];
  audit.measuring = true;
  return await auditRead();
});
await wait(5000);
const steadyAfter = await evaluate(async () => {
  audit.measuring = false;
  return { ...(await auditRead()), measurements: audit };
});
await writeFile(
  `${output}/${id}.json`,
  JSON.stringify(
    {
      id,
      origin,
      count,
      kind,
      size,
      initial,
      before,
      after,
      steadyBefore,
      steadyAfter,
      metricsBefore: mb,
      metricsAfter: ma,
    },
    null,
    2,
  ),
);
await writeFile(`${output}/${id}.cpuprofile`, JSON.stringify(profile.profile));
console.log(
  JSON.stringify({
    id,
    ready: after.ready,
    visible: after.visible,
    errors: after.errors,
    frames: after.pools.map((p, i) => p.stats.frames - before.pools[i].stats.frames),
    elapsed: after.time - before.time,
    gpuTimer: after.gpuTimer,
  }),
);
if (!process.env.KEEP) await evaluate(() => controllers.forEach((c) => c.dispose()));
socket.close();
