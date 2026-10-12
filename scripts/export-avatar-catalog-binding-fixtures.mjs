/** Read-only composed semantic anchors for native motion verification. */
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
const p = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const browser = await p.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (r) =>
    r.url().endsWith('/bindings.html')
      ? r.respond({
          contentType: 'text/html',
          body: '<!doctype html><body></body>',
        })
      : r.continue(),
  );
  await page.goto('http://localhost:6006/bindings.html');
  const index = JSON.parse(
    await readFile(
      'runtime/avatar/assets/catalog-library/index.json',
      'utf8',
    ),
  );
  const result = await page.evaluate(async (styles) => {
    const { composeCatalog } = await import(
      '/runtime/avatar/catalog-compose.ts'
    );
    const out = {};
    for (const eyes of styles) {
      const c = await composeCatalog(
        { shape: 'circle', eyes, eyewear: 'none', accessory: 'none' },
        'high',
      );
      out[eyes] = c.bindings.map((b) => ({
        id: b.part.id,
        fur: !!b.part.fur,
        category: b.part.category,
        selection: b.sourcePart.selection,
        sourceId: b.sourcePart.id,
        pivot: b.part.pivot,
        sourcePivot: b.sourcePart.pivot,
        transform: b.transform.toArray(),
        fields: b.part.fields,
      }));
      for (const p of c.source.parts) p.geometry.dispose();
    }
    return out;
  }, Object.keys(index.donors.eyes));
  await writeFile(
    '.local/avatar-catalog-binding-fixtures.json',
    JSON.stringify(result),
  );
} finally {
  await browser.close();
}
