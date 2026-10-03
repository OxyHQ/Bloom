/** Original engine/WASM CPU compositor matrix: all native parts on every actual body.
 * Requires Storybook; creates no WebGL context. Exact requested labels and body
 * vertex bytes are asserted independently of visual browser gates. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const p = await b.newPage();
    await p.route('**/__catalog.html', (r) =>
      r.fulfill({ contentType: 'text/html', body: '<body></body>' }),
    );
    await p.goto(
      `${process.argv[2] || 'http://localhost:6006'}/__catalog.html`,
    );
    const result = await p.evaluate(async () => {
      const m = await (
        await import('/bloom-character/orbit-characters.mjs')
      ).default({ locateFile: (f) => '/bloom-character/' + f });
      const { encodeAppearance } =
        await import('/bloom-character/appearance-codec.mjs');
      const { NATIVE_PARTS } =
        await import('/bloom-character/character-recipe.mjs');
      const {
        composePresetBody,
        composeCatalogParts,
        recordHasLabel,
        catalogPartCacheStats,
        originalBodyColor,
      } = await import('/bloom-character/catalog-parts.mjs');
      const {
        authoredAssemblyRecords,
        composeAuthoredParts,
        fitAuthoredEyeSpacing,
      } = await import('/bloom-character/authored-parts.mjs');
      const { composeClippoAssembly } =
        await import('/bloom-character/clippo-geometry.mjs');
      const shapes = [
        ...m.catalog(0).map((x) => ({ id: x.id, shape: x.id })),
        {
          id: 'todd',
          shape: 'rounded_head_two_ears',
          parts: { bodyPreset: 'lime_frog' },
        },
        { id: 'clippo', shape: 'circle', parts: { shape: 'clippo' } },
      ];
      const rows = [],
        errors = [];
      for (const body of shapes)
        for (const category of ['eyes', 'eyewear', 'accessory'])
          for (const id of NATIVE_PARTS[category]) {
            try {
              let appearance, base;
              for (const eyes of ['dots', 'oval', ...NATIVE_PARTS.eyes]) {
                appearance = encodeAppearance({
                  version: 1,
                  shape: body.shape,
                  color: 'blue',
                  eyes,
                  eyewear: 'none',
                  accessories: [],
                  accessoryColors: {},
                  constrained: 0,
                  depth: 0.5,
                  model: null,
                  rig: null,
                  hereCharacter: null,
                });
                const r = m.orbitPrepareAssembly(
                  appearance,
                  0,
                  'matrix-base-' + body.id,
                  false,
                );
                if (!r.bytes || r.error) continue;
                const info = authoredAssemblyRecords(r.bytes.slice());
                if (
                  !info.records
                    .slice(1)
                    .some((part) =>
                      NATIVE_PARTS.eyes.some((label) =>
                        recordHasLabel(info, part, label),
                      ),
                    )
                )
                  continue;
                base = info.bytes;
                break;
              }
              if (!base) throw Error('neutral base missing');
              const request = {
                appearance,
                quality: 0,
                key: 'matrix-' + body.id + '-' + category + '-' + id,
                activities: false,
                authoredParts: { ...body.parts, [category]: id },
              };
              let bytes = await composePresetBody(m, base, request);
              bytes = await composeClippoAssembly(m, bytes, request);
              const before = authoredAssemblyRecords(bytes);
              const expectedBody = bytes.slice(
                before.body.vertexOffset,
                before.body.vertexOffset + before.body.vertexCount * 96,
              );
              bytes = await composeCatalogParts(m, bytes, request);
              bytes = await composeAuthoredParts(m, bytes, request);
              bytes = await fitAuthoredEyeSpacing(bytes, request);
              const out = authoredAssemblyRecords(bytes),
                actual = bytes.slice(
                  out.body.vertexOffset,
                  out.body.vertexOffset + out.body.vertexCount * 96,
                );
              if (
                actual.length !== expectedBody.length ||
                !actual.every((v, i) => v === expectedBody[i])
              )
                throw Error('body vertices changed during part edit');
              const matching = out.records
                .slice(1)
                .filter((part) => recordHasLabel(out, part, id));
              if (id !== 'none' && !matching.length)
                throw Error('exact donor ID missing');
              rows.push({
                body: body.id,
                category,
                id,
                vertices: matching.map((p) => p.vertexCount),
              });
            } catch (e) {
              errors.push({ body: body.id, category, id, error: String(e) });
            }
          }
      return {
        rows,
        errors,
        cache: catalogPartCacheStats(),
        paints: {
          gus: originalBodyColor(m, 'gus'),
          blue_beret: originalBodyColor(m, 'blue_beret'),
        },
      };
    });
    fs.writeFileSync(
      '/tmp/bloom-catalog-matrix.json',
      JSON.stringify(result, null, 2),
    );
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.paints, { gus: '#ffd838', blue_beret: '#4778ff' });
    assert.equal(result.rows.length, 312);
    assert.ok(result.cache.bytes <= result.cache.maximumBytes);
    assert.equal(
      new Set(
        result.rows.map((row) => [row.body, row.category, row.id].join(':')),
      ).size,
      result.rows.length,
    );
    console.log(
      JSON.stringify(
        {
          rows: result.rows.length,
          errors: result.errors,
          cache: result.cache,
        },
        null,
        2,
      ),
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
