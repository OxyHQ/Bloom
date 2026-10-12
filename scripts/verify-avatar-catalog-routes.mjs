/** Load every custom crowd recipe at both LODs, including its motion bindings. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url),
  p = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const b = await p.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
try {
  const page = await b.newPage();
  await page.setRequestInterception(true);
  page.on('request', (r) =>
    r.url().endsWith('/catalog-check.html')
      ? r.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><body></body>' })
      : r.continue(),
  );
  await page.goto('http://localhost:6006/catalog-check.html');
  const result = await page.evaluate(async () => {
    const { resolveCompleteEditorRecipe } = await import(
      '/runtime/avatar/recipe.ts'
    );
    const { createCatalogAssetResolver } = await import(
      '/runtime/avatar/catalog-assets.ts'
    );
    const { createCatalogMotion } = await import(
      '/runtime/avatar/catalog-motion-factory.ts'
    );
    const { CHARACTER_SHAPES, createConfigForShape } = await import(
      '/src/agent-avatar/character-shapes.ts'
    );
    const presets = [
      'clippo',
      'blue_beret',
      'alfred',
      'purple_heart',
      'lime_frog',
      'coral_monocle',
      'gus',
      'blue_spectacles',
      'lime_headphones',
    ];
    const resolver = createCatalogAssetResolver(createCatalogMotion);
    const results = [];
    for (let i = 0; i < 48; i++) {
      const preset = presets[Math.floor(i / 2) % presets.length];
      const cfg = { character: { preset } };
      const config =
        i % 2
          ? createConfigForShape(
              cfg,
              CHARACTER_SHAPES[Math.floor(i / 2) % CHARACTER_SHAPES.length][0],
            )
          : cfg;
      const recipe = resolveCompleteEditorRecipe({ config, reduced: false });
      if (!recipe.catalog) continue;
      for (const detail of ['low', 'high'])
        try {
          const asset = await resolver(recipe.preset, detail);
          asset.source.parts.forEach((p) => p.geometry.dispose());
          results.push({ i, detail, recipe: recipe.catalog, pass: true });
        } catch (e) {
          results.push({ i, detail, recipe: recipe.catalog, error: e.message });
        }
    }
    return results;
  });
  await writeFile('.local/catalog-routes.json', JSON.stringify(result, null, 2));
  const failures = result.filter((r) => r.error);
  console.log(JSON.stringify({ cases: result.length, failures }));
  assert.deepEqual(failures, []);
} finally {
  await b.close();
}
