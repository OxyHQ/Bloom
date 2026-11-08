/** Rebuild the independently authored shapes without running the offline catalog extractor. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { buildReferenceAssets } from './reference-assets.mjs';
import { compactVectorAsset } from './compact-assets.mjs';
const root = fileURLToPath(new URL('../..', import.meta.url));
const directory = path.join(root, 'src/agent-avatar/vector-assets');
const manifest = JSON.parse(await fs.readFile(path.join(directory, 'manifest.json'), 'utf8'));
for (const entry of await buildReferenceAssets(root)) {
  const file = path.join(directory, entry.file);
  const data = compactVectorAsset(JSON.parse(await fs.readFile(file, 'utf8')), 'shape');
  const encoded = JSON.stringify({ encoding: 'json', data: JSON.stringify(data) });
  await fs.writeFile(file, encoded);
  const record = manifest.files.find((record) => record.file === entry.file);
  if (!record) throw Error(`Missing canonical shape ${entry.file}`);
  Object.assign(record, {
    bytes: Buffer.byteLength(encoded),
    gzipBytes: gzipSync(encoded).length,
    parts: data.parts.length,
    roles: [...new Set(data.parts.map((part) => part.role))],
  });
}
await fs.writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2));
for (const script of ['build-portraits.mjs', 'build-gallery-portraits.mjs']) {
  const result = spawnSync('bun', [path.join(root, 'scripts/avatar-vector', script)], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.status !== 0) throw Error(`${script} failed`);
}
const formatting = spawnSync(
  path.join(root, 'node_modules/.bin/biome'),
  ['format', '--write', 'src/agent-avatar/vector-static.ts'],
  { cwd: root, stdio: 'inherit' },
);
if (formatting.status !== 0) throw Error('Static portrait formatting failed');
