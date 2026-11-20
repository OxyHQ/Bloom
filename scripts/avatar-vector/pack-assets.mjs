/**
 * Content-addressed packing of the avatar vector assets.
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
 * clips of a part in one payload. `readVectorAsset` reads all three formats, to repack.
 *
 * Format 3 stores each payload's numeric arrays (points, faces, blink deltas, every channel's
 * samples) as integers in one base64 `data` string, losslessly. The extracted numbers are decimals
 * of at most a few places, so each array keeps its `decimals` and every number is an integer N
 * with `N / 10 ** decimals` the same double JSON.parse gave. An array is split into columns (x, y
 * and z of a point; each element of a channel's sample), and each column keeps its smallest N,
 * `min`, and how many little-endian bytes (0 to 4) hold `N - min`:
 *
 *   points, faces, delta0, delta1   { rows, decimals, columns: [[min, bytes] x 3] }
 *   channel.samples                 { samples, decimals, columns: [[min, bytes] x width] }
 *
 * Everything else (a channel's short `value`) stays plain JSON beside them, in order, and the
 * column bytes follow each other in that order. Packing fails on a number that is not exact.
 *
 * `unpackVectorAsset` is the exact inverse of the packing and `decodeBlob` reads what `encodeBlob`
 * writes; `src/agent-avatar/vector-pack.ts` mirrors both. Run by `build-avatar-vector-assets.mjs`; also
 * runnable alone (`node pack-assets.mjs`), where it is idempotent. It also writes
 * `src/agent-avatar/catalog/<kind>-<id>.ts`, one lazy module per asset, so an app can import
 * (and therefore ship) only the assets it uses.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const GEOMETRY = ['points', 'faces', 'delta0', 'delta1'];
const hashOf = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16);
const wrap = (value) => JSON.stringify({ encoding: 'json', data: JSON.stringify(value) });

export const PACK_FORMAT = 3;
export const isPacked = (data) => Array.isArray(data.tracks);
const ROW = 3;
/** The numbers in one sample of each channel: one column each. */
const CHANNEL_WIDTHS = {
  translation: 3,
  rotation: 4,
  scale: 3,
  camera: 4,
  coverage: 4,
  matrix: 16,
  parameters: 4,
  reference: 4,
};
/** Decimal places in the shortest text of `n` (`1e-7` has 7). */
function decimalsOf(n) {
  const [mantissa, exponent = '0'] = String(n).split('e');
  return Math.max(0, (mantissa.split('.')[1]?.length ?? 0) - Number(exponent));
}

/** Encodes one payload (a part's geometry or one clip's track) in format 3. */
export function encodeBlob(value) {
  const bytes = [];
  const encode = (numbers, width, where) => {
    if (numbers.length % width)
      throw new Error(`${where}: ${numbers.length} is not rows of ${width}`);
    let decimals = 0;
    for (const n of numbers) {
      if (!Number.isFinite(n)) throw new Error(`${where}: ${n} is not a finite number`);
      if (Object.is(n, -0)) throw new Error(`${where}: -0 would come back as 0`);
      decimals = Math.max(decimals, decimalsOf(n));
    }
    const scale = 10 ** decimals;
    const integers = numbers.map((n) => {
      const integer = Math.round(n * scale);
      if (!Number.isSafeInteger(integer) || !Object.is(integer / scale, n))
        throw new Error(`${where}: ${n} is not exact at ${decimals} decimals`);
      return integer;
    });
    const columns = [];
    for (let c = 0; c < width; c++) {
      const column = integers.filter((_, i) => i % width === c);
      const min = column.reduce((a, b) => Math.min(a, b), column[0] ?? 0);
      const range = column.reduce((a, b) => Math.max(a, b), min) - min;
      const size = [1, 2 ** 8, 2 ** 16, 2 ** 24, 2 ** 32].findIndex((limit) => range < limit);
      if (size < 0) throw new Error(`${where}: a range of ${range} does not fit 4 bytes`);
      for (const integer of column)
        for (let b = 0; b < size; b++) bytes.push(Math.floor((integer - min) / 256 ** b) % 256);
      columns.push([min, size]);
    }
    return { decimals, columns };
  };
  const blob = {};
  for (const [key, field] of Object.entries(value)) {
    if (Array.isArray(field)) {
      for (const row of field)
        if (row.length !== ROW) throw new Error(`${key}: a row of ${row.length}, not ${ROW}`);
      blob[key] = { rows: field.length, ...encode(field.flat(), ROW, key) };
    } else if (Array.isArray(field?.samples)) {
      const width = CHANNEL_WIDTHS[key];
      if (!width) throw new Error(`${key}: a channel of unknown width`);
      if (Object.keys(field).length !== 1) throw new Error(`${key}: samples beside other fields`);
      blob[key] = { samples: field.samples.length, ...encode(field.samples, width, key) };
    } else blob[key] = field;
  }
  return { ...blob, data: Buffer.from(bytes).toString('base64') };
}

/** The payload a format 3 blob holds; `vector-pack.ts` decodes it the same way at runtime. */
export function decodeBlob({ data, ...fields }) {
  const bytes = Buffer.from(data, 'base64');
  let at = 0;
  const decode = (count, { decimals, columns }) => {
    const values = new Array(count);
    columns.forEach(([min, size], c) => {
      for (let i = c; i < count; i += columns.length, at += size)
        values[i] = (min + (size ? bytes.readUIntLE(at, size) : 0)) / 10 ** decimals;
    });
    return values;
  };
  const payload = {};
  for (const [key, field] of Object.entries(fields)) {
    if (typeof field?.rows === 'number') {
      const values = decode(field.rows * ROW, field);
      payload[key] = Array.from({ length: field.rows }, (_, r) =>
        values.slice(r * ROW, r * ROW + ROW),
      );
    } else if (typeof field?.samples === 'number')
      payload[key] = { samples: decode(field.samples, field) };
    else payload[key] = field;
  }
  if (at !== bytes.length) throw new Error('Vector payload: bytes left over');
  return payload;
}

/** The text of a payload's blob file; fails unless it decodes to exactly `value`. */
export function blobText(value) {
  const text = JSON.stringify(encodeBlob(value));
  assert.deepStrictEqual(decodeBlob(JSON.parse(text)), value, 'Vector payload: packing is lossy');
  return text;
}

/** @returns {{ packed: object, blobs: Map<string, string> }} the asset and its blobs' text */
export function packVectorAsset(data) {
  const blobs = new Map();
  const put = (value) => {
    const text = blobText(value);
    const hash = hashOf(text);
    blobs.set(hash, text);
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

/** Reads an asset file from `directory` in its full form, packed (format 1 to 3) or not. */
export function readVectorAsset(directory, file) {
  const data = JSON.parse(JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')).data);
  if (!isPacked(data)) return data;
  return unpackVectorAsset(data, (hash) => {
    const blob = JSON.parse(fs.readFileSync(path.join(directory, 'blobs', `${hash}.json`), 'utf8'));
    return data.format >= 3 ? decodeBlob(blob) : JSON.parse(blob.data);
  });
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
    for (const [hash, text] of blobs) {
      if (allBlobs[hash]) continue;
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
