/** Resolve real catalog assets and inspect material RGB across every action. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(
  process.env.BLOOM_PUPPETEER_MODULE ||
    '/home/nate/Oxy/Homiio/node_modules/puppeteer-core',
);
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ||
    '/home/nate/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', {
    patterns: [
      { urlPattern: '*/avatar-pigment-proof.html', requestStage: 'Request' },
    ],
  });
  cdp.on('Fetch.requestPaused', (event) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: event.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from(
        '<!doctype html><title>Catalog pigment proof</title>',
      ).toString('base64'),
    }),
  );
  await page.goto(
    `${process.env.STORYBOOK_URL || 'http://localhost:6006'}/avatar-pigment-proof.html`,
  );
  await cdp.send('Fetch.disable');
  const rows = await page.evaluate(async () => {
    const { createCatalogAssetResolver } = await import(
      '/runtime/avatar/catalog-assets.ts'
    );
    const { createCatalogMotion } = await import(
      '/runtime/avatar/catalog-motion-factory.ts'
    );
    const resolve = createCatalogAssetResolver(createCatalogMotion),
      rows = [];
    for (const detail of ['low', 'high'])
      for (const shape of ['rounded_cube', 'circle']) {
        const asset = await resolve(
          `catalog:${JSON.stringify({ shape, eyes: 'todd', eyewear: 'none', accessory: 'three_lobe' })}`,
          detail,
        );
        const body = asset.source.parts.find(
          (part) => part.id === 0 && !part.fur,
        );
        const tufts = asset.source.parts.filter(
          (part) => part.attachment === 'three_lobe',
        );
        const base = body.fields.colorRoughness;
        const staticMatches = tufts.every((part) =>
          part.fields.colorRoughness.slice(0, 3).every((v, k) => v === base[k]),
        );
        const materialMatches = asset.source.material.parts
          .filter((part) => part.attachment === 'three_lobe')
          .every((part) =>
            part.fields.colorRoughness
              .slice(0, 3)
              .every((v, k) => v === base[k]),
          );
        if (!tufts.length || !staticMatches || !materialMatches)
          throw Error(`${shape}/${detail} static pigment mismatch`);
        for (const kind of ['idle', 'reaction', 'work']) {
          const sampler = asset.samplers[kind],
            pose = sampler.createPose();
          for (const fraction of [0, 0.1, 0.5, 0.9, 1]) {
            sampler.sample(sampler.clip.duration * fraction, pose);
            const bodyPaint = pose.find((part) => part.id === 'mesh:0').fields
              .colorRoughness;
            const parts = tufts.map((part) =>
              pose.find(
                (p) => p.id === `${part.fur ? 'fur' : 'mesh'}:${part.id}`,
              ),
            );
            if (
              parts.some(
                (part) =>
                  !part ||
                  !part.fields.colorRoughness
                    .slice(0, 3)
                    .every((v, k) => v === bodyPaint[k]),
              )
            )
              throw Error(
                `${shape}/${detail}/${kind}/${fraction}: animated pigment mismatch`,
              );
            rows.push({
              shape,
              detail,
              kind,
              fraction,
              bodyRGB: Array.from(bodyPaint.slice(0, 3)),
              matchingTuftParts: parts.length,
            });
          }
        }
        for (const part of asset.source.parts) part.geometry.dispose();
      }
    return rows;
  });
  assert.equal(rows.length, 60);
  assert.deepEqual(errors, []);
  await mkdir('.local/avatar-catalog-pigment', { recursive: true });
  await writeFile(
    '.local/avatar-catalog-pigment/report.json',
    JSON.stringify({ rows, errors }, null, 2),
  );
  console.log(
    `PASS ${rows.length} real catalog material/pose cases; no renderer or GPU required`,
  );
} finally {
  await browser.close();
}
