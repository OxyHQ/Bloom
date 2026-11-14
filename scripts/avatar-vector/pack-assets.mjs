/**
 * Lossless, content-addressed packing of the avatar vector assets.
 *
 * The 71 character assets share most of their geometry (the same head, the same eye
 * rig appear in many of them) and many animation tracks. Stored whole they weigh
 * 58 MB; stored once per distinct payload they weigh about half. Each asset file keeps
 * its small metadata and refers to its bulk payloads by hash:
 *
 *   part.geo          -> blobs/<hash>.json  { points, faces, delta0, delta1 }
 *   tracks[i][clip]   -> blobs/<hash>.json  the track of part i in that clip, or null (no payload)
 *
 * Format 2 (`format: 2`) stores each clip's track on its own, so a character drawn at rest loads
 * its `idle` tracks and not its `reaction` and `work` ones, nor the geometry of its `workOnly`
 * parts (the computer, hands and screens), until a gesture first plays. Format 1 kept the three
 * clips of a part in one payload; `readVectorAsset` still reads it, to repack.
 *
 * `unpackVectorAsset` is the exact inverse; `src/agent-avatar/vector-pack.ts` mirrors it.
 * Run by `build-avatar-vector-assets.mjs`; also runnable alone (`node pack-assets.mjs`),
 * where it is idempotent. It also writes `src/agent-avatar/catalog/<kind>-<id>.ts`, one
 * lazy module per asset, so an app can import (and therefore ship) only the assets it uses.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const GEOMETRY = ['points', 'faces', 'delta0', 'delta1'];
const hashOf = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16);
const wrap = (value) => JSON.stringify({ encoding: 'json', data: JSON.stringify(value) });

export const PACK_FORMAT = 2;
export const isPacked = (data) => Array.isArray(data.tracks);

/** @returns {{ packed: object, blobs: Map<string, object> }} */
export function packVectorAsset(data) {
  const blobs = new Map();
  const put = (value) => {
    const hash = hashOf(JSON.stringify(value));
    blobs.set(hash, value);
    return hash;
  };
  const clipNames = Object.keys(data.clips);
  const parts = data.parts.map((part, index) => {
    const geometry = {};
    const rest = {};
    for (const [key, value] of Object.entries(part)) {
      if (GEOMETRY.includes(key)) geometry[key] = value;
      else rest[key] = value;
    }
    const tracks = {};
    for (const name of clipNames) {
      const track = data.clips[name].parts[index] ?? null;
      tracks[name] = track === null ? null : put(track);
    }
    return { part: { ...rest, geo: put(geometry) }, tracks };
  });
  const clips = {};
  for (const name of clipNames) {
    const { parts: _parts, ...head } = data.clips[name];
    clips[name] = head;
  }
  const { parts: _parts, clips: _clips, ...top } = data;
  return {
    packed: {
      ...top,
      format: PACK_FORMAT,
      parts: parts.map((p) => p.part),
      clips,
      tracks: parts.map((p) => p.tracks),
    },
    blobs,
  };
}

/** @param {(hash: string) => object} readBlob */
export function unpackVectorAsset(packed, readBlob) {
  const { parts, clips, tracks, format: _format, ...top } = packed;
  // Format 1: one payload per part holding every clip's track.
  const legacy = typeof tracks[0] === 'string';
  const trackSets = tracks.map((entry) =>
    legacy
      ? readBlob(entry)
      : Object.fromEntries(
          Object.entries(entry).map(([name, hash]) => [
            name,
            hash === null ? null : readBlob(hash),
          ]),
        ),
  );
  return {
    ...top,
    parts: parts.map(({ geo, ...part }) => ({ ...part, ...readBlob(geo) })),
    clips: Object.fromEntries(
      Object.entries(clips).map(([name, head]) => [
        name,
        { ...head, parts: trackSets.map((set) => set[name] ?? null) },
      ]),
    ),
  };
}

export const blobHashes = (packed) => [
  ...new Set([
    ...packed.parts.map((p) => p.geo),
    ...packed.tracks.flatMap((entry) =>
      typeof entry === 'string' ? [entry] : Object.values(entry).filter((hash) => hash !== null),
    ),
  ]),
];

/** Reads an asset file from `directory` in its full form, packed or not. */
export function readVectorAsset(directory, file) {
  const data = JSON.parse(JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')).data);
  if (!isPacked(data)) return data;
  return unpackVectorAsset(data, (hash) =>
    JSON.parse(
      JSON.parse(fs.readFileSync(path.join(directory, 'blobs', `${hash}.json`), 'utf8')).data,
    ),
  );
}

const idKey = (id) => JSON.stringify(id);

/** Packs every asset the manifest lists and rewrites the lazy `catalog/` modules. */
export function packVectorAssets(root) {
  const directory = path.join(root, 'src/agent-avatar/vector-assets');
  const catalog = path.join(root, 'src/agent-avatar/catalog');
  const manifestPath = path.join(directory, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const full = manifest.files.map((record) => ({
    record,
    data: readVectorAsset(directory, record.file),
  }));
  fs.rmSync(path.join(directory, 'blobs'), { recursive: true, force: true });
  fs.mkdirSync(catalog, { recursive: true });
  for (const file of fs.readdirSync(catalog))
    if (/^(shape|eyes|eyewear|accessory|template)-.+\.ts$/.test(file))
      fs.rmSync(path.join(catalog, file));
  fs.mkdirSync(path.join(directory, 'blobs'), { recursive: true });
  const allBlobs = {};
  for (const { record, data } of full) {
    const { packed, blobs } = packVectorAsset(data);
    for (const [hash, value] of blobs) {
      if (allBlobs[hash]) continue;
      const text = wrap(value);
      fs.writeFileSync(path.join(directory, 'blobs', `${hash}.json`), text);
      allBlobs[hash] = { bytes: Buffer.byteLength(text), gzipBytes: gzipSync(text).length };
    }
    const text = wrap(packed);
    fs.writeFileSync(path.join(directory, record.file), text);
    record.bytes = Buffer.byteLength(text);
    record.gzipBytes = gzipSync(text).length;
    record.blobs = blobHashes(packed);
    record.parts = packed.parts.length;
    const module = record.file.replace(/\.json$/, '');
    fs.writeFileSync(
      path.join(catalog, `${module}.ts`),
      [
        '// Generated by scripts/avatar-vector/pack-assets.mjs. Do not edit by hand.',
        `import { packedVectorAsset } from '../vector-pack';`,
        '',
        `/** ${record.kind} ${idKey(record.id)}: lazy, ${record.blobs.length} shared payloads. */`,
        'export default packedVectorAsset(',
        `  () => import('../vector-assets/${record.file}'),`,
        '  {',
        ...record.blobs.map(
          (hash) =>
            `    ${JSON.stringify(hash)}: () => import('../vector-assets/blobs/${hash}.json'),`,
        ),
        '  },',
        ');',
        '',
      ].join('\n'),
    );
  }
  // Emit what Biome would write, so regenerating changes nothing but the data.
  spawnSync(path.join(root, 'node_modules/.bin/biome'), ['format', '--write', catalog], {
    cwd: root,
    stdio: 'inherit',
  });
  manifest.blobs = allBlobs;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return { assets: full.length, blobs: Object.keys(allBlobs).length };
}

if (
  process.argv[1] &&
  import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href
) {
  const root = fileURLToPath(new URL('../..', import.meta.url));
  console.log('Packed', packVectorAssets(root));
}
