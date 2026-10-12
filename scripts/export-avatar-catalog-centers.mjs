/** Export the reference scene center for each body with its default Todd eyes.
 * Used to fit Computer entry/exit to edited eyes and accessories. */
import { createRequire } from 'node:module';
import fs from 'node:fs';
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
try {
  const p = await browser.newPage();
  await p.setRequestInterception(true);
  p.on('request', (r) =>
    r.url().endsWith('/catalog-check.html')
      ? r.respond({ contentType: 'text/html', body: '<!doctype html>' })
      : r.continue(),
  );
  await p.goto('http://localhost:6006/catalog-check.html');
  const result = await p.evaluate(async () => {
    const { composeCatalog } = await import('/runtime/avatar/catalog-compose.ts');
    let out = [];
    const shapes = Object.keys(
      (await (await fetch('/runtime/avatar/assets/catalog-library/index.json')).json()).donors.body,
    );
    const cases = [
      ...shapes.map((shape) => ({ shape, accessory: 'none' })),
      { shape: 'circle', accessory: 'felipe_beret' },
    ];
    for (const { shape, accessory } of cases) {
      const c = await composeCatalog({ shape, eyes: 'todd', eyewear: 'none', accessory }, 'high');
      const original = c.body.sceneBounds;
      let b = structuredClone(original);
      for (const { part } of c.bindings)
        for (let k = 0; k < 3; k++) {
          b.min[k] = Math.min(b.min[k], part.bounds.min[k]);
          b.max[k] = Math.max(b.max[k], part.bounds.max[k]);
        }
      out.push({
        shape,
        accessory,
        original,
        bounds: b,
        center: b.min.map((v, k) => (v + b.max[k]) / 2),
      });
      for (const partofc of c.source.parts) partofc.geometry.dispose();
    }
    return out;
  });
  console.log(JSON.stringify(result, null, 2));
  fs.writeFileSync(
    'runtime/avatar/assets/catalog-computer/scene-centers.json',
    JSON.stringify(
      Object.fromEntries(
        result.filter((r) => r.accessory === 'none').map((r) => [r.shape, r.center]),
      ),
    ),
  );
  fs.mkdirSync('.local/avatar-catalog-computer', { recursive: true });
  fs.writeFileSync('.local/avatar-catalog-computer/scene-centers.json', JSON.stringify(result));
} finally {
  await browser.close();
}
