/** Compatibility inventory, deliberately separate from performance measurements. */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const output = process.env.AVATAR_API_OUTPUT || '.local/avatar-gl-api';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewport({ width: 128, height: 128, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => {
    window.audit = { phase: 'startup', calls: {}, special: [], extensions: [] };
    const contexts = new WeakMap(),
      get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      const context = get.call(this, type, ...args);
      if (!context || !/^webgl/.test(type)) return context;
      if (contexts.has(context)) return contexts.get(context);
      const methods = new Map();
      const proxy = new Proxy(context, {
        set(target, key, value) {
          return Reflect.set(target, key, value, target);
        },
        get(target, key) {
          const value = Reflect.get(target, key, target);
          if (typeof value !== 'function') return value;
          if (!methods.has(key))
            methods.set(key, (...args) => {
              const name = String(key);
              audit.calls[audit.phase] ??= {};
              const phase = audit.calls[audit.phase];
              phase[name] = (phase[name] ?? 0) + 1;
              if (
                [
                  'renderbufferStorageMultisample',
                  'blitFramebuffer',
                  'texStorage2D',
                  'texStorage3D',
                  'readPixels',
                ].includes(name) &&
                audit.special.filter((x) => x.name === name).length < 8
              )
                audit.special.push({
                  name,
                  args: args.map((a) => (ArrayBuffer.isView(a) ? a.constructor.name : a)),
                });
              const result = value.apply(target, args);
              if (key === 'getExtension' && result && !audit.extensions.includes(args[0]))
                audit.extensions.push(args[0]);
              return result;
            });
          return methods.get(key);
        },
      });
      contexts.set(context, proxy);
      return proxy;
    };
  });
  const origin = process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6008';
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*/avatar-gl-api.html' }] });
  cdp.on('Fetch.requestPaused', (event) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: event.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from(
        '<!doctype html><body style="margin:0"><canvas style="width:128px;height:128px"></canvas>',
      ).toString('base64'),
    }),
  );
  await page.goto(`${origin}/avatar-gl-api.html`);
  await cdp.send('Fetch.disable');
  await page.evaluate(async () => {
    const { AuthoredAvatarEngine } = await import('/runtime/avatar/authored-engine.ts');
    window.engine = new AuthoredAvatarEngine(document.querySelector('canvas'), {
      count: 1,
      size: 128,
      lazyWork: true,
    });
    await engine.loaded;
    engine.idle(0);
  });
  await page.waitForFunction(() => engine.stats().frames >= 5);
  await page.evaluate(() => {
    audit.phase = 'idle';
    window.beforeFrame = engine.stats().frames;
  });
  await page.waitForFunction(() => engine.stats().frames >= beforeFrame + 30);
  await page.evaluate(async () => {
    audit.phase = 'work-loading';
    await engine.prepareWork(0);
    audit.phase = 'work';
    engine.work(0);
    window.beforeFrame = engine.stats().frames;
  });
  await page.waitForFunction(() => engine.stats().frames >= beforeFrame + 30);
  await page.evaluate(() => {
    audit.phase = 'dispose';
    engine.dispose();
  });
  const report = await page.evaluate(() => audit);
  report.errors = errors;
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        methods: [...new Set(Object.values(report.calls).flatMap((x) => Object.keys(x)))].sort(),
        special: report.special,
        extensions: report.extensions,
        errors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
