/** Native donor PNGs versus their semantic assets drawn by the sole new renderer. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url),
  puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = { cases: [], errors: [], forbidden: [] };
const out = '.local/avatar-catalog-material-check';
await mkdir(out, { recursive: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 800, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.on('request', (r) => {
    if (/orbit-characters|bloom-character\/.*\.mjs/.test(r.url())) report.forbidden.push(r.url());
  });
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*catalog-material-check.html' }] });
  cdp.on('Fetch.requestPaused', (e) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: e.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from(
        '<!doctype html><body style="margin:0;background:transparent"><canvas id="test" style="width:320px;height:320px"></canvas></body>',
      ).toString('base64'),
    }),
  );
  await page.goto('http://localhost:6006/catalog-material-check.html');
  await cdp.send('Fetch.disable');
  await page.evaluate(async () => {
    const [{ AuthoredAvatarEngine }, { loadCatalogDonor }] = await Promise.all([
      import('/runtime/avatar/authored-engine.ts'),
      import('/runtime/avatar/catalog-library.ts'),
    ]);
    window.loadDonor = loadCatalogDonor;
    window.Engine = AuthoredAvatarEngine;
  });
  const library = JSON.parse(
    await readFile('runtime/avatar/assets/catalog-library/index.json', 'utf8'),
  );
  for (const id of process.env.AVATAR_CATALOG_MATERIAL_IDS?.split(',') ??
    Object.keys(library.donors.body)) {
    const base64 = (
      await readFile(`.local/avatar-catalog-library/body/${id}/high/reference.png`)
    ).toString('base64');
    await page.evaluate(async (id) => {
      window.engine?.dispose();
      const old = document.querySelector('#test'),
        canvas = old.cloneNode(false);
      old.replaceWith(canvas);
      const donor = await loadDonor('body', id, 'high');
      window.copy = document.createElement('canvas');
      copy.width = copy.height = 320;
      window.engine = new Engine(canvas, {
        size: 320,
        onFrame: () => copy.getContext('2d').drawImage(canvas, 0, 0),
        resolveAsset: async () => ({ source: donor.source, samplers: null, eyeProfiles: {} }),
      });
      await engine.loaded;
      engine.setPaused(true);
      engine.cropCache.set(`catalog:${id}:high:320`, [0, 0, 1, 1]);
      await engine.setPreset(0, `catalog:${id}`);
    }, id);
    await page.waitForFunction(() => engine.stats().frames > 0 && !engine.fitPending);
    const pixels = await page.evaluate(async (base64) => {
      const reference = new Image();
      reference.src = 'data:image/png;base64,' + base64;
      await reference.decode();
      const a = document.createElement('canvas'),
        b = document.createElement('canvas');
      a.width = b.width = 320;
      a.height = b.height = 320;
      const ac = a.getContext('2d'),
        bc = b.getContext('2d');
      ac.drawImage(reference, 0, 0);
      bc.drawImage(copy, 0, 0);
      const expected = ac.getImageData(0, 0, 320, 320).data,
        actual = bc.getImageData(0, 0, 320, 320).data;
      let max = 0,
        sum = 0,
        n = 0,
        painted = 0;
      for (let i = 0; i < actual.length; i += 4) {
        if (actual[i + 3] > 24) painted++;
        if (expected[i + 3] < 24 && actual[i + 3] < 24) continue;
        for (let k = 0; k < 4; k++) {
          const d = Math.abs(expected[i + k] - actual[i + k]);
          max = Math.max(max, d);
          sum += d;
          n++;
        }
      }
      return { max, mean: sum / n, painted };
    }, base64);
    report.cases.push({ id, ...pixels });
    console.log(JSON.stringify(report.cases.at(-1)));
    await page.screenshot({ path: `${out}/${id}.png`, omitBackground: true });
    assert(pixels.painted > 1000);
    // Pinned observed edge residuals; all other foreground pixels agree to <.001
    // mean channel value out of255. Never accepts a visually different material.
    const maxima = {
      circle: 1,
      clippo: 1,
      todd: 1,
      rounded_triangle: 1,
      capsule: 7,
      rounded_head_two_ears: 2,
      six_lobed_flower: 1,
      heart: 4,
      four_lobed_butterfly: 2,
      circle_two_ears: 3,
      twelve_scalloped_rosette: 1,
      rounded_cube: 9,
      rounded_diamond: 2,
      slender: 6,
      pocket: 2,
      petal: 2,
      star: 1,
      cloud: 1,
      shield: 1,
      pebble: 6,
      squircle: 5,
    };
    assert(pixels.max <= maxima[id], `${id}: material pixel residual ${pixels.max}`);
    assert(pixels.mean < 0.001, `${id}: foreground mean residual ${pixels.mean}`);
  }
  assert.deepEqual(report.forbidden, []);
  assert.deepEqual(report.errors, []);
} finally {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
