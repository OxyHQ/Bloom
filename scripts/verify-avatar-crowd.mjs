/** Visible crowd benchmark. MIXED=1, THROTTLE=4 and COUNTS=1,6,10 select stress scenarios. */
import puppeteer from 'puppeteer-core';
import { writeFile } from 'node:fs/promises';
const b = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--disable-crash-reporter', '--no-zygote', '--enable-precise-memory-info'],
});
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 1000 });
const results = [];
const client = await p.createCDPSession();
await client.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.THROTTLE || 1) });
try {
  await p.goto(
    `${process.env.STORYBOOK_URL || 'http://localhost:6006'}/iframe.html?id=agents-agent-avatar--gallery&viewMode=story`,
    { waitUntil: 'domcontentloaded', timeout: 120000 },
  );
  await p.waitForSelector('[data-bloom-vector-avatar]', { timeout: 120000 });
  await p.evaluate(async () => {
    window.crowd = await import('/scripts/avatar-fixtures/crowd-entry.tsx');
  });
  await p.evaluate(() => window.crowd.mount(0));
  await client.send('HeapProfiler.collectGarbage');
  const emptyHeap = (await p.metrics()).JSHeapUsedSize;
  for (const count of (process.env.COUNTS || '10,30,50').split(',').map(Number)) {
    await p.evaluate(({ count, mixed }) => window.crowd.mount(count, mixed), {
      count,
      mixed: process.env.MIXED === '1',
    });
    await p.waitForFunction(
      (count) =>
        document.querySelectorAll('#crowd [data-bloom-vector-avatar] svg').length === count,
      { timeout: 120000 },
      count,
    );
    await new Promise((r) => setTimeout(r, 500));
    await p.evaluate(() => {
      window.avatarPeakHeap = performance.memory?.usedJSHeapSize ?? 0;
      window.avatarHeapTimer = setInterval(() => {
        window.avatarPeakHeap = Math.max(
          window.avatarPeakHeap,
          performance.memory?.usedJSHeapSize ?? 0,
        );
      }, 50);
    });
    const cpuBefore = await p.metrics();
    const before = await p.$$eval('#crowd [data-bloom-vector-avatar]', (ns) =>
      ns.map((n) => +n.dataset.frame),
    );
    const start = Date.now();
    await new Promise((r) => setTimeout(r, 2000));
    const after = await p.$$eval('#crowd [data-bloom-vector-avatar]', (ns) =>
      ns.map((n) => +n.dataset.frame),
    );
    const elapsed = Date.now() - start;
    const cpuAfter = await p.metrics();
    await p.evaluate(() => {
      const first = document.querySelector('#crowd [data-bloom-vector-avatar]');
      window.clickResult = new Promise((resolve) => {
        let start = 0;
        first.addEventListener(
          'pointerdown',
          () => {
            start = performance.now();
          },
          { once: true },
        );
        const observer = new MutationObserver(() => {
          if (first.dataset.action === 'reaction') {
            observer.disconnect();
            resolve(performance.now() - start);
          }
        });
        observer.observe(first, { attributes: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, 2000);
      });
    });
    await p.click('#crowd [data-bloom-vector-avatar]');
    const clickLatency = await p.evaluate(() => window.clickResult);
    const otherActions = await p.$$eval('#crowd [data-bloom-vector-avatar]', (nodes) =>
      nodes.slice(1).map((node) => node.dataset.action),
    );
    if (otherActions.some((action) => action !== 'idle'))
      throw new Error('Interacting with one avatar changed another avatar action');
    const peakSampledHeap = await p.evaluate(() => {
      clearInterval(window.avatarHeapTimer);
      return window.avatarPeakHeap;
    });
    await client.send('HeapProfiler.collectGarbage');
    const metrics = await p.metrics();
    results.push({
      count,
      elapsed,
      frames: after.map((x, i) => x - before[i]),
      emptyHeap,
      heap: metrics.JSHeapUsedSize,
      peakSampledHeap,
      clickLatency,
      cpuWindowSeconds: cpuAfter.Timestamp - cpuBefore.Timestamp,
      taskSeconds: cpuAfter.TaskDuration - cpuBefore.TaskDuration,
      scriptSeconds: cpuAfter.ScriptDuration - cpuBefore.ScriptDuration,
      throttle: Number(process.env.THROTTLE || 1),
      mixed: process.env.MIXED === '1',
    });
    console.log(JSON.stringify(results.at(-1)));
  }
  await writeFile(process.argv[2] || '.local/avatar-crowd-report.json', JSON.stringify(results));
} finally {
  await b.close();
}
