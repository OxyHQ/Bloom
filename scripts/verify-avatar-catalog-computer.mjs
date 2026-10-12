/** Real-browser decode/composition gate against independent offline observations.
 * Covers body, Computer props, visibility and camera; attachment motion has its
 * own rig gate and is deliberately not claimed by this check. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const library = await read('runtime/avatar/assets/catalog-library/index.json');
const cases = [
  ...Object.keys(library.donors.body)
    .filter((shape) => shape !== 'todd')
    .map((shape) => ({ shape, source: shape, accessory: 'none' })),
  { shape: 'circle', source: 'circle-beret', accessory: 'felipe_beret' },
];
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = { cases: [], errors: [], forbidden: [] };
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.on('request', (r) => {
    if (/orbit-characters|\/bloom-character\/.*\.mjs/.test(r.url())) report.forbidden.push(r.url());
  });
  await page.setRequestInterception(true);
  page.on('request', (r) =>
    r.url().endsWith('/catalog-computer-check.html')
      ? r.respond({ contentType: 'text/html', body: '<!doctype html>' })
      : r.continue(),
  );
  await page.goto('http://localhost:6006/catalog-computer-check.html');
  for (const c of cases) {
    const raw = await read(`.local/avatar-catalog-computer/${c.source}/work-raw.json`);
    const first = raw.calls.find(
      (c) => c.method === 'applyActivity' && c.args[0].command === 1,
    ).renderTime;
    const ids = new Map();
    let next = 0;
    const frames = raw.frames
      .filter((f) => f.renderTime >= first)
      .map((f) => ({
        time: f.renderTime - first,
        draws: f.draws.flatMap((d, k) => {
          if (k !== 0 && d.blocks.DrawBlock[43] >= 0) return [];
          const buffer = d.vertexAttributes.find((a) => a.name === 'position').bufferId;
          if (k !== 0 && !ids.has(buffer)) ids.set(buffer, next++);
          return [
            {
              id: k === 0 ? 'body' : ids.get(buffer),
              values: d.blocks.DrawBlock,
              camera: f.draws[0].blocks.FrameBlock,
            },
          ];
        }),
      }));
    const result = await page.evaluate(
      async ({ c, frames }) => {
        const { composeCatalog } = await import('/runtime/avatar/catalog-compose.ts');
        const { attachCatalogComputer } = await import('/runtime/avatar/catalog-computer.ts');
        const composition = await composeCatalog(
          { shape: c.shape, eyes: 'todd', eyewear: 'none', accessory: c.accessory },
          'high',
        );
        const firstId = Math.max(...composition.source.parts.map((p) => p.id)) + 1;
        const sampler = await attachCatalogComputer(composition, c.shape),
          pose = sampler.createPose();
        let world = 0,
          normal = 0,
          camera = 0,
          visibility = 0,
          values = 0;
        const baseline = frames[0].draws[0].camera;
        for (const frame of frames) {
          sampler.sample(frame.time, pose);
          const observed = new Map(
            frame.draws.map((d) => [d.id === 'body' ? 'mesh:0' : `mesh:${firstId + d.id}`, d]),
          );
          for (const p of pose) {
            const d = observed.get(p.id);
            visibility = Math.max(visibility, Math.abs(p.fields.camera[3] - (d ? 1 : 0)));
            if (!d) continue;
            for (let k = 0; k < 16; k++) {
              world = Math.max(world, Math.abs(p.world.elements[k] - d.values[k]));
              normal = Math.max(normal, Math.abs(p.normalMatrix.elements[k] - d.values[16 + k]));
              values += 2;
            }
            const expected = [
              d.camera[0] / baseline[0],
              d.camera[5] / baseline[5],
              (d.camera[13] - baseline[13]) / baseline[5],
            ];
            for (let k = 0; k < 3; k++)
              camera = Math.max(camera, Math.abs(p.fields.camera[k] - expected[k]));
          }
        }
        for (const p of composition.source.parts) p.geometry.dispose();
        return { world, normal, camera, visibility, values };
      },
      { c, frames },
    );
    report.cases.push({ ...c, ...result });
    assert(result.world < 2e-7, `${c.source}: world ${result.world}`);
    assert(result.normal < 5e-5, `${c.source}: normal`);
    assert.equal(result.camera, 0);
    assert.equal(result.visibility, 0);
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.forbidden, []);
} finally {
  await browser.close();
  await mkdir('.local/avatar-catalog-computer-check', { recursive: true });
  await writeFile(
    '.local/avatar-catalog-computer-check/report.json',
    JSON.stringify(report, null, 2),
  );
}
console.log(JSON.stringify(report, null, 2));
