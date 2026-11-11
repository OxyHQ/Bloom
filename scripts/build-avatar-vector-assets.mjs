/** Generate CPU/SVG character data from the checked-in avatar catalog.
 * Start the source Storybook server, then run with CHROME_PATH set. No WebGL is used.
 * BLOOM_PUPPETEER_MODULE can point at an existing puppeteer-core installation.
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { compactVectorAsset } from './avatar-vector/compact-assets.mjs';
import { packVectorAssets } from './avatar-vector/pack-assets.mjs';
import { extractCharacter } from './avatar-vector/extract-character.mjs';
import { buildReferenceAssets } from './avatar-vector/reference-assets.mjs';
import { withPeriReaction } from './avatar-vector/felipe-reaction.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
const output = path.join(root, 'src/agent-avatar/vector-assets');
await fs.mkdir(output, { recursive: true });
const server = process.env.BLOOM_VECTOR_SOURCE_URL || 'http://localhost:6006';
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
const groups = { shape: {}, eyes: {}, eyewear: {}, accessory: {}, template: {} };
const manifest = { version: 1, files: [], coverage: {} };
const templateCharacters = {};
const write = async (entry, data) => {
  // Retire the bulb without changing the other authored template parts or motion.
  if (entry.kind === 'template' && data.identity?.recipe?.accessory === 'orb') {
    const keep = data.parts
      .map((part, index) => (part.role !== 'accessory' ? index : -1))
      .filter((index) => index >= 0);
    data.parts = keep.map((index) => data.parts[index]);
    for (const clip of Object.values(data.clips))
      clip.parts = keep.map((index) => clip.parts[index]);
    data.identity.recipe.accessory = 'none';
  }
  if (entry.kind === 'template') templateCharacters[entry.id] = entry.character;
  const json = JSON.stringify(data),
    file = `${entry.kind}-${entry.id}.json`;
  await fs.writeFile(path.join(output, file), json);
  groups[entry.kind][entry.id] = file;
  const record = {
    kind: entry.kind,
    id: entry.id,
    file,
    bytes: Buffer.byteLength(json),
    gzipBytes: gzipSync(json).length,
    parts: data.parts.length,
    roles: [...new Set(data.parts.map((p) => p.role))],
  };
  manifest.files.push(record);
  console.log(entry.kind, entry.id, record.bytes, record.roles.join(','));
};
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error(e.message));
  await page.setRequestInterception(true);
  page.on('request', (request) =>
    request.url().endsWith('/vector-asset-extraction.html')
      ? request.respond({
          status: 200,
          contentType: 'text/html',
          body: '<!doctype html><title>Vector assets</title>',
        })
      : request.continue(),
  );
  await page.goto(`${server}/vector-asset-extraction.html`);
  const templates = await page.evaluate(async () => {
    const m = await import('/src/agent-creator/constants.ts');
    const { AVATAR_PRESETS } = await import('/src/agent-avatar/catalog-ids.ts');
    return AVATAR_PRESETS.map((id) => ({
      id,
      title: m.CHARACTER_PRESETS.find((p) => p.id === id)?.title || id,
      character: m.CHARACTER_TEMPLATES[id],
    }));
  });
  const catalog = JSON.parse(
    await fs.readFile(path.join(root, 'runtime/avatar/assets/catalog-library/index.json'), 'utf8'),
  );
  const periEntry = {
    kind: 'template',
    id: 'peri',
    title: 'Peri',
    character: { preset: 'blue_beret' },
  };
  const peri = await page.evaluate(extractCharacter, periEntry);
  await write(periEntry, peri);
  for (const item of templates) {
    const entry = { ...item, kind: 'template' };
    let data = await page.evaluate(extractCharacter, entry);
    data = withPeriReaction(data, peri);
    await write(entry, data);
  }
  const common = {
    shape: 'circle',
    eyes: 'oval',
    eyewear: 'none',
    accessory: 'none',
    color: 'blue',
  };
  for (const [kind, donorGroup] of [
    ['shape', 'body'],
    ['eyes', 'eyes'],
    ['eyewear', 'eyewear'],
    ['accessory', 'accessory'],
  ]) {
    for (const id of Object.keys(catalog.donors[donorGroup])) {
      if (id === 'none') continue;
      const character = { ...common, [kind]: id };
      const entry = { kind, id, title: id, character };
      const data = await page.evaluate(extractCharacter, entry);
      const required = kind === 'shape' ? 'body' : kind === 'eyes' ? 'eye' : kind;
      if (!data.parts.some((p) => p.role === required))
        throw Error(`Missing ${required} category for ${kind}:${id}`);
      await write(entry, data);
    }
  }
  const references = await buildReferenceAssets(root, browser);
  for (const record of references) {
    const id = `bot_${record.id}`;
    groups.shape[id] = record.file;
    manifest.files.push({ kind: 'shape', ...record, id });
  }
  groups.eyes.bot = groups.shape.bot_blob;
  manifest.coverage = {
    shapes: Object.keys(groups.shape),
    eyes: [...Object.keys(groups.eyes), 'none'],
    eyewear: ['none', ...Object.keys(groups.eyewear)],
    accessories: ['none', ...Object.keys(groups.accessory)],
    templates: Object.keys(groups.template),
  };
  // Keep TypeScript from constructing millions of numeric-literal AST nodes.
  // Consumers lazily decode one selected asset after its literal JSON import.
  for (const record of manifest.files) {
    const file = path.join(output, record.file),
      raw = await fs.readFile(file, 'utf8');
    const compact = compactVectorAsset(JSON.parse(raw), record.kind);
    record.parts = compact.parts.length;
    record.roles = [...new Set(compact.parts.map((part) => part.role))];
    const encoded = JSON.stringify({ encoding: 'json', data: JSON.stringify(compact) });
    await fs.writeFile(file, encoded);
    record.bytes = Buffer.byteLength(encoded);
    record.gzipBytes = gzipSync(encoded).length;
  }
  await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2));
  // Share identical geometry and tracks between assets and emit one lazy module per asset.
  console.log('Packed', packVectorAssets(root));
  const lines = [
    '// Generated by scripts/build-avatar-vector-assets.mjs. Do not edit by hand.',
    "import type { VectorAssetImport } from './vector-pack';",
    '/** Each entry is one lazy asset: a module of its own under `./catalog`, so a bundler can drop the ones nothing imports. */',
    'const lazy =',
    '  (load: () => Promise<{ default: VectorAssetImport }>): VectorAssetImport =>',
    '  () =>',
    '    load().then((module) => module.default());',
    '',
  ];
  for (const [kind, name] of [
    ['shape', 'vectorShapeImports'],
    ['eyes', 'vectorEyeImports'],
    ['eyewear', 'vectorEyewearImports'],
    ['accessory', 'vectorAccessoryImports'],
    ['template', 'vectorTemplateImports'],
  ]) {
    lines.push(`export const ${name} = {`);
    for (const [id, file] of Object.entries(groups[kind]))
      lines.push(
        `  ${JSON.stringify(id)}: lazy(() => import('./catalog/${file.replace(/\\.json$/, '')}')),`,
      );
    lines.push('} as const;', '');
  }
  lines.push("export { vectorTemplateCharacters } from './vector-template-characters';", '');
  await fs.writeFile(
    path.join(root, 'src/agent-avatar/vector-template-characters.ts'),
    [
      '// Generated by scripts/build-avatar-vector-assets.mjs. Do not edit by hand.',
      "import type { AvatarCharacter } from './character';",
      `export const vectorTemplateCharacters = ${JSON.stringify(templateCharacters)} as const satisfies Record<string, AvatarCharacter>;`,
      '',
    ].join('\n'),
  );
  await fs.writeFile(path.join(root, 'src/agent-avatar/vector-asset-imports.ts'), lines.join('\n'));
  const portraits = spawnSync(
    process.env.BUN_BINARY || 'bun',
    [path.join(root, 'scripts/avatar-vector/build-portraits.mjs')],
    { env: process.env, stdio: 'inherit' },
  );
  if (portraits.status !== 0) throw new Error('Vector portrait generation failed.');
  const formatting = spawnSync(
    path.join(root, 'node_modules/.bin/biome'),
    [
      'format',
      '--write',
      'src/agent-avatar/vector-asset-imports.ts',
      'src/agent-avatar/vector-static.ts',
      'src/agent-avatar/vector-template-characters.ts',
    ],
    { cwd: root, stdio: 'inherit' },
  );
  if (formatting.status !== 0) throw new Error('Vector generated module formatting failed.');
  console.log('Generated', manifest.files.length, 'assets', manifest.coverage);
} finally {
  await browser.close();
}
