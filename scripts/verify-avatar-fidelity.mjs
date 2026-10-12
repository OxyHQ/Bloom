import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const preset = process.env.AVATAR_PRESET || 'blue_beret';
const devicePixelRatio = Number(process.env.AVATAR_DPR || 1);
const cssSize = Number(process.env.AVATAR_SIZE || 320);
assert(
  !process.env.AVATAR_BODY_COLOR,
  'Native bodyColor exits the authored preset and changes geometry/materials; a fixed-preset tint is not a paired fixture.',
);
const output = process.env.AVATAR_FIDELITY_OUTPUT || '.local/avatar-fidelity';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage();
  // Material regression compares the SAME observed pose. Native startup pose can
  // differ with backing resolution; this is not a controller/animation test.
  if (process.env.AVATAR_CAPTURE_STATE) {
    const captured = JSON.parse(await readFile(process.env.AVATAR_CAPTURE_STATE, 'utf8'));
    const material = JSON.parse(
      await readFile(`runtime/avatar/assets/${preset}/material.json`, 'utf8'),
    );
    const draws = captured.draws.filter(
      (d) => d.method === 'drawElements' && d.defines.some((s) => s.includes('FELIPE_MATERIAL')),
    );
    assert.equal(draws.length, material.parts.length);
    material.parts.forEach((part, i) => {
      let offset = 0;
      for (const [name, previous] of Object.entries(part.fields)) {
        const observed = draws[i].uniformBlocks.DrawBlock.slice(offset, offset + previous.length);
        part.fields[name] = observed;
        offset += previous.length;
      }
    });
    const copy = captured.canvasCopies.findLast(
      (c) => c.destinationCss.width === cssSize && c.args.length === 8,
    );
    assert(copy, 'paired fixture includes its native presentation crop');
    const [sx, sy, sw, sh, dx, dy, dw, dh] = copy.args;
    material.crop = [
      (sx - (dx * sw) / dw) / copy.destinationWidth,
      (sy - (dy * sh) / dh) / copy.destinationHeight,
      sw / dw,
      sh / dh,
    ];
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().endsWith(`/assets/${preset}/material.json`))
        request.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(material),
        });
      else request.continue();
    });
  }
  const requests = [];
  page.on('request', (req) => requests.push(req.url()));
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.setViewport({ width: 640, height: 480, deviceScaleFactor: devicePixelRatio });
  await page.goto('http://localhost:6006/iframe.html');
  await page.evaluate(
    async ({ preset, cssSize }) => {
      document.body.replaceChildren();
      document.body.style.cssText = 'margin:0;background:#f5f5f2';
      const canvas = document.createElement('canvas');
      canvas.style.cssText = `display:block;width:${cssSize}px;height:${cssSize}px`;
      document.body.append(canvas);
      const { AuthoredAvatarEngine } = await import(
        '/runtime/avatar/authored-engine.ts'
      );
      window.engine = new AuthoredAvatarEngine(canvas, { preset, size: cssSize });
      await window.engine.loaded;
    },
    { preset, cssSize },
  );
  await page.waitForFunction(() => window.engine?.stats().frames > 0, { timeout: 60000 });
  await (await page.$('canvas')).screenshot({ path: `${output}/new.png` });
  const reference = await readFile(
    process.env.AVATAR_REFERENCE || `runtime/avatar/assets/${preset}/reference.png`,
  );
  const actual = await readFile(`${output}/new.png`);
  const comparison = await page.evaluate(
    async (images) => {
      const decoded = await Promise.all(
        images.map(async (src) => {
          const image = new Image();
          image.src = src;
          await image.decode();
          const c = document.createElement('canvas');
          c.width = image.width;
          c.height = image.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(image, 0, 0);
          return {
            data: ctx.getImageData(0, 0, c.width, c.height),
            width: c.width,
            height: c.height,
          };
        }),
      );
      const [a, b] = decoded;
      const diff = document.createElement('canvas');
      diff.width = a.width;
      diff.height = a.height;
      const ctx = diff.getContext('2d');
      const pixels = ctx.createImageData(a.width, a.height);
      let sum = 0,
        foregroundSum = 0,
        count = 0,
        max = 0,
        changed = 0;
      const bounds = [
        { minX: a.width, minY: a.height, maxX: 0, maxY: 0 },
        { minX: a.width, minY: a.height, maxX: 0, maxY: 0 },
      ];
      for (let p = 0; p < a.width * a.height; p++) {
        const bg = [245, 245, 242];
        const mask = decoded.map((im, k) => {
          const active = bg.some((v, c) => Math.abs(im.data.data[p * 4 + c] - v) > 20);
          if (active) {
            bounds[k].minX = Math.min(bounds[k].minX, p % a.width);
            bounds[k].maxX = Math.max(bounds[k].maxX, p % a.width);
            bounds[k].minY = Math.min(bounds[k].minY, Math.floor(p / a.width));
            bounds[k].maxY = Math.max(bounds[k].maxY, Math.floor(p / a.width));
          }
          return active;
        });
        let pixelDifference = 0;
        for (let c = 0; c < 3; c++) {
          const d = Math.abs(a.data.data[p * 4 + c] - b.data.data[p * 4 + c]);
          sum += d;
          max = Math.max(max, d);
          pixelDifference += d;
          pixels.data[p * 4 + c] = Math.min(255, d * 8);
        }
        pixels.data[p * 4 + 3] = 255;
        if (mask.some(Boolean)) {
          count++;
          foregroundSum += pixelDifference;
        }
        if (pixelDifference) changed++;
      }
      ctx.putImageData(pixels, 0, 0);
      return {
        width: a.width,
        height: a.height,
        meanAbsoluteChannelError: sum / (a.width * a.height * 3),
        foregroundMeanAbsoluteChannelError: foregroundSum / (count * 3),
        foregroundPixels: count,
        maxChannelError: max,
        changedPixels: changed,
        bounds,
        difference: diff.toDataURL('image/png'),
      };
    },
    [reference, actual].map((bytes) => 'data:image/png;base64,' + bytes.toString('base64')),
  );
  await writeFile(
    `${output}/difference-x8.png`,
    Buffer.from(comparison.difference.split(',')[1], 'base64'),
  );
  delete comparison.difference;
  const debug = await page.evaluate(() => {
    const gl = window.engine.renderer.getContext(),
      p = gl.getParameter(gl.CURRENT_PROGRAM);
    return {
      glError: gl.getError(),
      uniforms: Array.from({ length: gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) }, (_, i) => {
        const n = gl.getActiveUniform(p, i).name;
        const v = gl.getUniform(p, gl.getUniformLocation(p, n));
        return [n, typeof v === 'number' ? v : Array.from(v || [])];
      }),
    };
  });
  await writeFile(`${output}/debug.json`, JSON.stringify(debug, null, 2));
  const stats = await page.evaluate(() => window.engine.stats());
  await writeFile(`${output}/report.json`, JSON.stringify({ stats, comparison, errors }, null, 2));
  console.log(JSON.stringify({ stats, comparison, errors }));
  assert.deepEqual(errors, []);
  assert.equal(debug.glError, 0);
  assert.deepEqual(comparison.bounds[0], comparison.bounds[1], 'same visible silhouette bounds');
  assert(
    comparison.foregroundMeanAbsoluteChannelError < 1,
    'less than one 8-bit level mean foreground error; not exact pixel parity',
  );
  assert.equal(
    requests.filter((url) => /\.wasm(?:$|\?)|orbit-characters\.mjs|preparation-worker/.test(url))
      .length,
    0,
    'independent runtime must not fetch original engine',
  );
} finally {
  await browser.close();
}
