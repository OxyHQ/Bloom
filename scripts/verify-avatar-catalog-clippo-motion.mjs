/** Independent native captures versus the complete published composition factory.
 * Numeric world/normal/material proof, not a screenshot or timing benchmark. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { catalogDrawFields } from './build-avatar-catalog-motion.mjs';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const cases = [];
for (const detail of ['low', 'high'])
  for (const kind of ['idle', 'reaction', 'work']) {
    const raw = await read(
      `.local/avatar-catalog-clippo-special/${detail === 'low' ? 'low/' : ''}${kind}-raw.json`,
    );
    const start = kind === 'idle' ? 3.683333333333333 : 3,
      end = kind === 'idle' ? 9.633333333333333 : kind === 'reaction' ? 5.733333333333333 : 7;
    cases.push({
      detail,
      kind,
      frames: raw.frames
        .filter((f) => f.renderTime >= start - 1e-9 && f.renderTime <= end + 1e-9)
        .map((f) => ({
          time: f.renderTime - start,
          draws: f.draws.slice(0, 7).map((d) => d.blocks.DrawBlock),
        })),
    });
  }
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
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', {
    patterns: [{ urlPattern: '*/clippo-motion-check.html' }],
  });
  cdp.on('Fetch.requestPaused', async (e) => {
    await cdp.send('Fetch.fulfillRequest', {
      requestId: e.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from('<!doctype html>').toString('base64'),
    });
    await cdp.send('Fetch.disable');
  });
  await page.goto('http://localhost:6006/clippo-motion-check.html');
  for (const detail of ['low', 'high']) {
    const result = await page.evaluate(
      async ({ detail, cases, names }) => {
        const { composeCatalog } = await import('/runtime/avatar/catalog-compose.ts');
        const { attachCatalogComputer } = await import('/runtime/avatar/catalog-computer.ts');
        const { createCatalogMotion } = await import('/runtime/avatar/catalog-motion-factory.ts');
        const c = await composeCatalog(
          {
            shape: 'clippo',
            eyes: 'clippo',
            eyewear: 'none',
            accessory: 'none',
          },
          detail,
        );
        const Matrix4 = c.bindings[0].transform.constructor;
        const base = await attachCatalogComputer(c, 'clippo');
        const { samplers } = await createCatalogMotion(c, detail, base);
        const results = [];
        for (const scenario of cases.filter((c) => c.detail === detail)) {
          const sampler = samplers[scenario.kind],
            pose = sampler.createPose();
          let world = 0,
            normal = 0,
            fields = 0,
            localWorld = 0,
            localNormal = 0,
            at = null;
          const inverse = new Matrix4(),
            nativeInverse = new Matrix4(),
            local = new Matrix4(),
            nativeLocal = new Matrix4();
          for (const frame of scenario.frames) {
            sampler.sample(frame.time, pose);
            const body = pose.find((p) => p.id === `mesh:0`);
            for (let id = 0; id < 7; id++) {
              const p = pose.find((p) => p.id === `mesh:${id}`),
                d = frame.draws[id];
              if (!p) throw Error(`Missing Clippo ${id}`);
              if (id > 0) {
                inverse.copy(body.world).invert();
                nativeInverse.fromArray(frame.draws[0]).invert();
                local.copy(inverse).multiply(p.world);
                nativeLocal.copy(nativeInverse).multiply(new Matrix4().fromArray(d));
                for (let k = 0; k < 16; k++)
                  localWorld = Math.max(
                    localWorld,
                    Math.abs(local.elements[k] - nativeLocal.elements[k]),
                  );
                inverse.copy(body.normalMatrix).invert();
                nativeInverse.fromArray(frame.draws[0], 16).invert();
                local.copy(inverse).multiply(p.normalMatrix);
                nativeLocal.copy(nativeInverse).multiply(new Matrix4().fromArray(d, 16));
                for (let k = 0; k < 16; k++)
                  localNormal = Math.max(
                    localNormal,
                    Math.abs(local.elements[k] - nativeLocal.elements[k]) /
                      Math.max(1, ...nativeLocal.elements.map(Math.abs)),
                  );
              }
              for (let k = 0; k < 16; k++) {
                const e = Math.abs(p.world.elements[k] - d[k]);
                if (e > world) {
                  world = e;
                  at = [frame.time, id, k];
                }
                normal = Math.max(
                  normal,
                  Math.abs(p.normalMatrix.elements[k] - d[16 + k]) /
                    Math.max(1, ...d.slice(16, 32).map(Math.abs)),
                );
              }
              if (id > 0)
                for (let n = 0; n < names.length; n++)
                  for (let k = 0; k < 4; k++)
                    fields = Math.max(fields, Math.abs(p.fields[names[n]][k] - d[32 + 4 * n + k]));
            }
          }
          results.push({
            detail,
            kind: scenario.kind,
            frames: scenario.frames.length,
            world,
            normal,
            fields,
            localWorld,
            localNormal,
            at,
          });
        }
        for (const p of c.source.parts) p.geometry.dispose();
        return results;
      },
      { detail, cases, names: catalogDrawFields },
    );
    report.cases.push(...result);
  }
  console.log(JSON.stringify(report));
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.forbidden, []);
  for (const c of report.cases) {
    assert(c.world < 5e-7, `${c.detail}/${c.kind} world ${c.world} at ${c.at}`);
    assert(c.normal < 5e-7, `${c.kind} normal ${c.normal}`);
    assert(c.fields < 2.4e-7, `${c.kind} fields ${c.fields}`);
  }
} finally {
  await browser.close();
  await mkdir('.local/avatar-catalog-clippo-special', { recursive: true });
  await writeFile(
    '.local/avatar-catalog-clippo-special/factory-report.json',
    JSON.stringify(report, null, 2),
  );
}
