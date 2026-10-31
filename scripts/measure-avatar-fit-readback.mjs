/** Isolates synchronous versus fenced alpha fitting on the same current engine. */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
const baselineCommit = '6adb842b';
const source = execFileSync(
  'git',
  ['show', `${baselineCommit}:runtime/avatar/authored-engine.ts`],
  { encoding: 'utf8' },
);
const start = source.indexOf('  private updateCrops() {'),
  end = source.indexOf('\n  stats() {', start);
if (start < 0 || end < 0) throw Error('Synchronous fit control not found');
const control = ts.transpileModule(
  `class Control {\n${source.slice(start, end)}\n}\nreturn Control.prototype.updateCrops;`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } },
).outputText;
const origin = process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007';
const output = process.env.AVATAR_FIT_OUTPUT || '.local/avatar-fit-readback';
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const report = [];
for (const asyncFit of [false, true, true, false]) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--disable-gpu-shader-disk-cache'],
  });
  try {
    const page = await browser.newPage();
    const cdp = await page.createCDPSession();
    await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*/fit-paired.html' }] });
    cdp.on('Fetch.requestPaused', (e) =>
      cdp.send('Fetch.fulfillRequest', {
        requestId: e.requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
        body: Buffer.from('<!doctype html><body>').toString('base64'),
      }),
    );
    await page.goto(`${origin}/fit-paired.html`);
    await cdp.send('Fetch.disable');
    const result = await page.evaluate(
      async ({ asyncFit, control }) => {
        const { AuthoredAvatarEngine } = await import('/runtime/avatar/authored-engine.ts');
        if (!asyncFit) AuthoredAvatarEngine.prototype.updateCrops = new Function(control)();
        const records = {},
          longtasks = [];
        let previous = performance.now(),
          maxGap = 0;
        const timer = setInterval(() => {
          const now = performance.now();
          maxGap = Math.max(maxGap, now - previous);
          previous = now;
        }, 5);
        const observer = new PerformanceObserver((list) =>
          longtasks.push(
            ...list.getEntries().map((x) => ({ start: x.startTime, duration: x.duration })),
          ),
        );
        observer.observe({ type: 'longtask' });
        for (const name of ['readPixels', 'getBufferSubData', 'clientWaitSync']) {
          const original = WebGL2RenderingContext.prototype[name];
          WebGL2RenderingContext.prototype[name] = function (...args) {
            const start = performance.now();
            const result = original.apply(this, args);
            const ms = performance.now() - start;
            const entry = (records[name] ??= { count: 0, ms: 0, max: 0 });
            entry.count++;
            entry.ms += ms;
            entry.max = Math.max(entry.max, ms);
            return result;
          };
        }
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'width:128px;height:128px';
        document.body.append(canvas);
        const start = performance.now();
        let delivered;
        const done = new Promise((resolve) => (delivered = resolve));
        const engine = new AuthoredAvatarEngine(canvas, {
          size: 128,
          lazyWork: true,
          onFrame: () => delivered(),
        });
        await done;
        const ready = performance.now() - start;
        await new Promise((r) => setTimeout(r, 30));
        clearInterval(timer);
        observer.disconnect();
        const result = {
          asyncFit,
          readyMs: ready,
          maxHeartbeatGapMs: maxGap,
          longtasks,
          records,
          fitPasses: engine.stats().fitPasses,
        };
        engine.dispose();
        return result;
      },
      { asyncFit, control },
    );
    report.push(result);
    console.log(JSON.stringify(result));
  } finally {
    await browser.close();
  }
}
await mkdir(output, { recursive: true });
await writeFile(
  `${output}/report.json`,
  `${JSON.stringify({ baselineCommit, origin, scope: 'Fresh SwiftShader browsers; synchronous fit method control on identical current engine; one blue preset128; CPU heartbeat and first delivered readiness, not warm FPS. Shader disk cache disabled. Native unchanged.', cases: report }, null, 2)}\n`,
);
