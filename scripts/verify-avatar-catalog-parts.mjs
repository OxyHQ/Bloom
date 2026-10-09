/** Original-engine CPU/WASM compositor matrix on all21 actual bodies.
 * This checks588 single parts,1512 eye/eyewear pairs and756 eye/accessory pairs.
 * No WebGL context is created; real pixel/selected-recipe gates remain separate. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const facesOnly = process.argv.includes('--faces');
try {
  const page = await browser.newPage();
  await page.route('**/__catalog.html', (r) =>
    r.fulfill({ contentType: 'text/html', body: '<body>' }),
  );
  await page.goto(
    `${process.argv.find((v) => v.startsWith('http')) || 'http://localhost:6006'}/__catalog.html`,
  );
  const result = await page.evaluate(async (facesOnly) => {
    const m = await (
      await import('/bloom-character/orbit-characters.mjs')
    ).default({ locateFile: (f) => '/bloom-character/' + f });
    const { encodeAppearance } =
      await import('/bloom-character/appearance-codec.mjs');
    const { NATIVE_PARTS } =
      await import('/bloom-character/character-recipe.mjs');
    const { MIGRATED_CONTOURS } =
      await import('/bloom-character/migrated-contours.mjs');
    const {
      composePresetBody,
      composeCatalogParts,
      recordHasLabel,
      catalogPartCacheStats,
      originalBodyColor,
    } = await import('/bloom-character/catalog-parts.mjs');
    const {
      authoredAssemblyRecords,
      authoredEyeRecords,
      fitAuthoredEyeSpacing,
      fitAuthoredHeadwear,
      shapeFaceLayout,
    } = await import('/bloom-character/authored-parts.mjs');
    const { deformLegacyAssembly } =
      await import('/bloom-character/legacy-geometry.mjs');
    const { composeClippoAssembly } =
      await import('/bloom-character/clippo-geometry.mjs');
    const { composeCyclopsAssembly } =
      await import('/bloom-character/cyclops-geometry.mjs');
    const { sha256 } = await import('/bloom-character/sha256.mjs');
    const shapes = [
      ...m.catalog(0).map((x) => ({ id: x.id, shape: x.id })),
      {
        id: 'todd',
        shape: 'rounded_head_two_ears',
        parts: { faceShape: 'rounded_head_two_ears' },
      },
      { id: 'clippo', shape: 'circle', parts: { shape: 'clippo' } },
      ...Object.entries(MIGRATED_CONTOURS).map(([id, points]) => ({
        id,
        shape: 'circle',
        points,
      })),
    ];
    const eyes = [...NATIVE_PARTS.eyes, 'todd', 'clippo', 'cyclops'],
      accessories = [...NATIVE_PARTS.accessory, 'felipe_beret'];
    const jobs = [
      ...eyes.map((eyes) => ({ kind: 'single-eye', eyes })),
      ...NATIVE_PARTS.eyewear.map((eyewear) => ({
        kind: 'single-eyewear',
        eyes: 'oval',
        eyewear,
      })),
      ...accessories.map((accessory) => ({
        kind: 'single-accessory',
        eyes: 'oval',
        accessory,
      })),
      ...eyes.flatMap((eyes) =>
        NATIVE_PARTS.eyewear.map((eyewear) => ({
          kind: 'eye-eyewear',
          eyes,
          eyewear,
        })),
      ),
      ...eyes.flatMap((eyes) =>
        ['hat', 'headphones', 'bow'].map((accessory) => ({
          kind: 'eye-accessory',
          eyes,
          accessory,
        })),
      ),
    ];
    const rows = [],
      errors = [];
    if (facesOnly) jobs.splice(eyes.length);
    for (const body of shapes) {
      let appearance, base;
      for (const eye of ['dots', 'oval', ...NATIVE_PARTS.eyes]) {
        appearance = encodeAppearance({
          version: 1,
          shape: body.shape,
          color: 'blue',
          eyes: eye,
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
        if (!authoredEyeRecords(info).length) continue;
        base = info.bytes;
        break;
      }
      if (!base) {
        errors.push({ body: body.id, error: 'neutral base missing' });
        continue;
      }
      for (const job of jobs) {
        try {
          const parts = {
            ...body.parts,
            ...(body.id !== 'todd' && body.id !== 'clippo'
              ? { faceShape: body.id }
              : {}),
            eyes: job.eyes,
            ...(job.eyewear ? { eyewear: job.eyewear } : {}),
            ...(job.accessory ? { accessory: job.accessory } : {}),
          };
          const request = {
            appearance,
            quality: 0,
            key: 'matrix-' + body.id + '-' + JSON.stringify(job),
            activities: false,
            authoredParts: parts,
            points: body.points,
          };
          let bytes = await composePresetBody(m, base, request);
          if (body.points)
            bytes = deformLegacyAssembly(bytes, {
              points: body.points,
              geometryKey: await sha256(
                new TextEncoder().encode(
                  JSON.stringify([body.id, body.points]),
                ),
              ),
            });
          request.faceLayout = shapeFaceLayout(
            authoredAssemblyRecords(bytes),
            request,
            m,
          );
          if (parts.shape === 'clippo' || parts.eyes === 'clippo')
            bytes = await composeClippoAssembly(m, bytes, request);
          const before = authoredAssemblyRecords(bytes),
            expected = bytes.slice(
              before.body.vertexOffset,
              before.body.vertexOffset + before.body.vertexCount * 96,
            );
          bytes = await composeCatalogParts(m, bytes, request, [
            'eyes',
            'accessory',
          ]);
          if (parts.eyes === 'cyclops')
            bytes = await composeCyclopsAssembly(m, bytes, request);
          bytes = await composeCatalogParts(m, bytes, request, ['eyewear']);
          bytes = await fitAuthoredEyeSpacing(bytes, request);
          bytes = await fitAuthoredHeadwear(bytes, request);
          const out = authoredAssemblyRecords(bytes),
            actual = bytes.slice(
              out.body.vertexOffset,
              out.body.vertexOffset + out.body.vertexCount * 96,
            );
          if (
            actual.length !== expected.length ||
            !actual.every((v, i) => v === expected[i])
          )
            throw Error('body vertices changed during part edit');
          const matching = (id) =>
            out.records.slice(1).filter((p) => recordHasLabel(out, p, id));
          if (
            NATIVE_PARTS.eyes.includes(job.eyes) &&
            !matching(job.eyes).length
          )
            throw Error('requested native eye geometry missing');
          if (!NATIVE_PARTS.eyes.includes(job.eyes)) {
            const count = authoredEyeRecords(out).length,
              expectedCount = job.eyes === 'cyclops' ? 5 : 4;
            if (count !== expectedCount)
              throw Error(
                `requested ${job.eyes} geometry count ${count}, expected${expectedCount}`,
              );
            const face = authoredEyeRecords(out);
            const groups =
              job.eyes === 'cyclops'
                ? [face]
                : [-1, 1].map((sign) =>
                    face.filter(
                      (p) =>
                        Math.sign((p.bounds.min[0] + p.bounds.max[0]) / 2) ===
                        sign,
                    ),
                  );
            for (const [i, group] of groups.entries()) {
              if (!group.length) throw Error('missing intrinsic face group');
              const bounds = {
                min: [0, 1].map((k) =>
                  Math.min(...group.map((p) => p.bounds.min[k])),
                ),
                max: [0, 1].map((k) =>
                  Math.max(...group.map((p) => p.bounds.max[k])),
                ),
              };
              const radius =
                job.eyes === 'cyclops'
                  ? (bounds.max[0] - bounds.min[0]) / 2
                  : Math.max(
                      bounds.max[0] - bounds.min[0],
                      bounds.max[1] - bounds.min[1],
                    ) / 2;
              const expectedRadius =
                request.faceLayout.radius * (job.eyes === 'cyclops' ? 2 : 1);
              if (Math.abs(radius - expectedRadius) > 0.005)
                throw Error('eye style changed shape-owned size');
              for (let k = 0; k < 2; k++) {
                const center = (bounds.min[k] + bounds.max[k]) / 2;
                const desired =
                  job.eyes === 'cyclops'
                    ? (request.faceLayout.centers[0][k] +
                        request.faceLayout.centers[1][k]) /
                      2
                    : request.faceLayout.centers[i][k];
                if (Math.abs(center - desired) > 0.005)
                  throw Error('eye style moved shape-owned center');
              }
            }
          }
          for (const category of ['eyewear', 'accessory']) {
            const id = job[category];
            if (!id || id === 'none') continue;
            const actualId = id === 'felipe_beret' ? 'beret' : id;
            if (!matching(actualId).length)
              throw Error(`requested ${category}:${id} geometry missing`);
          }
          rows.push({
            body: body.id,
            ...job,
            eyeRecords: authoredEyeRecords(out).length,
            vertices: out.body.vertexCount,
          });
        } catch (e) {
          errors.push({ body: body.id, ...job, error: String(e) });
        }
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
      shapes: shapes.map((s) => s.id),
      jobs: jobs.length,
    };
  }, facesOnly);
  fs.writeFileSync(
    '/tmp/bloom-catalog-matrix.json',
    JSON.stringify(result, null, 2),
  );
  const summary = {
    rows: result.rows.length,
    errors: result.errors,
    shapes: result.shapes.length,
    jobs: result.jobs,
    cache: result.cache,
  };
  console.log(JSON.stringify(summary, null, 2));
  assert.deepEqual(result.errors, []);
  assert.equal(result.shapes.length, 21);
  assert.equal(result.jobs, facesOnly ? 12 : 136);
  assert.equal(result.rows.length, facesOnly ? 252 : 2856);
  assert.deepEqual(result.paints, { gus: '#ffd838', blue_beret: '#4778ff' });
  assert.ok(result.cache.bytes <= result.cache.maximumBytes);
  assert.equal(
    new Set(
      result.rows.map((r) =>
        JSON.stringify([r.body, r.kind, r.eyes, r.eyewear, r.accessory]),
      ),
    ).size,
    result.rows.length,
  );
} finally {
  await browser.close();
}
