import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const root = 'runtime/avatar/assets/catalog-library';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const catalog = await read(`${root}/index.json`);
const cases = [];
for (const eyes of Object.keys(catalog.donors.eyes))
  cases.push({
    shape: 'circle',
    eyes,
    raw: `.local/avatar-catalog-material-roles/${eyes}/idle-raw.json`,
  });
for (const shape of Object.keys(catalog.donors.body))
  cases.push({ shape, eyes: 'todd', raw: `.local/avatar-catalog-computer/${shape}/work-raw.json` });
for (const c of cases) {
  const raw = await read(c.raw);
  c.expected = raw.frames[0].draws[0].blocks.DrawBlock.slice(80, 88);
}
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:6006');
  const results = await page.evaluate(async (cases) => {
    const { composeCatalog } = await import('/runtime/avatar/catalog-compose.ts');
    const results = [];
    for (const c of cases) {
      const composed = await composeCatalog(
        { shape: c.shape, eyes: c.eyes, eyewear: 'none', accessory: 'none' },
        'high',
      );
      const parts = composed.source.parts.filter((p) => p.category === 'body');
      const masks = parts.map((p) => [...p.fields.furEye0, ...p.fields.furEye1]);
      results.push({ shape: c.shape, eyes: c.eyes, expected: c.expected, masks });
      for (const p of composed.source.parts) p.geometry.dispose();
    }
    return results;
  }, cases);
  await mkdir('.local/avatar-catalog-fur-check', { recursive: true });
  await writeFile(
    '.local/avatar-catalog-fur-check/report.json',
    JSON.stringify({ cases: results, errors }, null, 2),
  );
  for (const result of results)
    for (const mask of result.masks) {
      const differences = mask.map((v, k) => v - result.expected[k]);
      // Clippo's scaled donor geometry has an independently measured one-ULP
      // Y-bound residual. Pin that exact shortfall; all other cases are exact.
      const expectedDifference =
        result.shape === 'circle' && result.eyes === 'clippo'
          ? [0, 2 ** -26, 0, 2 ** -26, 0, 0, 0, 0]
          : Array(8).fill(0);
      assert.deepEqual(differences, expectedDifference, `${result.shape}/${result.eyes}: fur mask`);
    }
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      cases: results.length,
      exactCases: results.length - 1,
      maximumResidual: 2 ** -26,
      errors,
    }),
  );
} finally {
  await browser.close();
}
