/** Physical diagnostic fixture. Timing canvases must never be read with getImageData/toDataURL. */
import { send, evaluate, wait, socket } from './fixtures/avatar/physical-web/cdp.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
const output = process.env.AVATAR_OUTPUT || '.local/avatar-physical-web';
await mkdir(output, { recursive: true });
const out = output;
const prefix = process.env.ID || 'storybook-candidate';
await send('Performance.enable');
await send('Profiler.enable');
await send('Profiler.setSamplingInterval', { interval: 1000 });
await evaluate(async () => {
  window.auditRuntime = [...globalThis[Symbol.for('bloom.character.runtimes')].values()][0];
  window.audit = { raf: [], copies: [], long: [], events: [], measuring: false };
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
        canvas: [...document.querySelectorAll('canvas')].indexOf(this.canvas),
      });
    return result;
  };
  new PerformanceObserver((list) => {
    if (audit.measuring)
      audit.long.push(...list.getEntries().map((x) => ({ at: x.startTime, duration: x.duration })));
  }).observe({ entryTypes: ['longtask'] });
  for (const type of ['pointerdown', 'touchstart', 'scroll'])
    addEventListener(
      type,
      (e) => {
        if (audit.measuring)
          audit.events.push({
            type,
            delay: performance.now() - e.timeStamp,
            at: performance.now(),
          });
      },
      { passive: true, capture: true },
    );
  window.auditRead = async () => {
    const ds = await auditRuntime.diagnostics();
    const gl = document.querySelector('[data-avatar-renderer]').getContext('webgl2');
    return {
      time: performance.now(),
      hidden: document.hidden,
      viewport: [innerWidth, innerHeight, devicePixelRatio],
      scrollY,
      canvasRects: [...document.querySelectorAll('canvas:not([data-avatar-renderer])')].map((c) => {
        const r = c.getBoundingClientRect();
        return [r.x, r.y, r.width, r.height, c.width, c.height];
      }),
      gpuTimer: !!gl.getExtension('EXT_disjoint_timer_query_webgl2'),
      pools: ds.map(({ stats, ...p }) => ({ ...p, stats: { ...stats, states: undefined } })),
    };
  };
});
async function sample(id, action) {
  const before = await evaluate(async () => {
    audit.raf = [];
    audit.copies = [];
    audit.long = [];
    audit.events = [];
    audit.measuring = true;
    return await auditRead();
  });
  const metricsBefore = await send('Performance.getMetrics');
  await send('Profiler.start');
  if (action) await action();
  await wait(5000);
  const profile = await send('Profiler.stop');
  const metricsAfter = await send('Performance.getMetrics');
  const after = await evaluate(async () => {
    audit.measuring = false;
    return { ...(await auditRead()), measurements: audit };
  });
  const result = { id, before, after, metricsBefore, metricsAfter };
  const steadyBefore = await evaluate(async () => {
    audit.raf = [];
    audit.copies = [];
    audit.long = [];
    audit.events = [];
    audit.measuring = true;
    return await auditRead();
  });
  await wait(5000);
  const steadyAfter = await evaluate(async () => {
    audit.measuring = false;
    return { ...(await auditRead()), measurements: audit };
  });
  result.steadyBefore = steadyBefore;
  result.steadyAfter = steadyAfter;
  await writeFile(`${out}/${id}.json`, JSON.stringify(result, null, 2));
  await writeFile(`${out}/${id}.cpuprofile`, JSON.stringify(profile.profile));
  console.log(
    JSON.stringify({
      id,
      frames: after.pools.map((p, i) => p.stats.frames - before.pools[i].stats.frames),
      elapsed: after.time - before.time,
      raf: after.measurements.raf.length,
      copies: after.measurements.copies.length,
      long: after.measurements.long,
    }),
  );
}
await sample(`${prefix}-still`);
if (process.env.STILL_ONLY) {
  socket.close();
  process.exit(0);
}
await sample(`${prefix}-scroll`, async () => {
  await send('Input.synthesizeScrollGesture', {
    x: 180,
    y: 760,
    yDistance: -1450,
    speed: 600,
    gestureSourceType: 'touch',
  });
});
await evaluate(() => scrollTo(0, 0));
await wait(1500);
await sample(`${prefix}-input`, async () => {
  const xy = await evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Work');
    const r = b.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...xy, id: 1 }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
});
socket.close();
