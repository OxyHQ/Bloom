/** Read-only locality audit. No vertex attributes, triangles or production assets change.
 * FIFO/LRU are estimates, not hardware counters or frame-rate predictions. */
import assert from 'node:assert/strict';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { MeshoptEncoder } from 'meshoptimizer';
await MeshoptEncoder.ready;
const root = 'runtime/avatar/assets',
  records = [],
  skipped = [];
async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (/^(computer-)?geometry(-low)?\.json$/.test(entry.name)) files.push(path);
  }
  return files;
}
const model = (indices, size, lru) => {
  const cache = [];
  let misses = 0;
  for (const index of indices) {
    const hit = cache.indexOf(index);
    if (hit < 0) {
      misses++;
      cache.unshift(index);
      if (cache.length > size) cache.pop();
    } else if (lru && hit > 0) {
      cache.splice(hit, 1);
      cache.unshift(index);
    }
  }
  return misses;
};
const triangles = (indices) => {
  const values = [];
  for (let i = 0; i < indices.length; i += 3)
    values.push(indices[i] * 4294967296 + indices[i + 1] * 65536 + indices[i + 2]);
  return values.sort((a, b) => a - b);
};
for (const path of await walk(root)) {
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  const computer = path.endsWith('computer-geometry.json');
  const catalogComputer = path.includes('/catalog-computer/');
  const variants = catalogComputer
    ? await Promise.all(
        (await readdir(dirname(path), { withFileTypes: true }))
          .filter((entry) => entry.isDirectory())
          .map((entry) =>
            readFile(join(dirname(path), entry.name, 'material.json'), 'utf8').then(JSON.parse),
          ),
      )
    : [];
  const material = catalogComputer
    ? variants[0]
    : JSON.parse(
        await readFile(
          join(dirname(path), computer ? 'computer-material.json' : 'material.json'),
          'utf8',
        ),
      );
  const baseIds = computer
    ? new Set(
        JSON.parse(await readFile(join(dirname(path), 'material.json'), 'utf8')).parts.map(
          (part) => part.id,
        ),
      )
    : null;
  const buffer = await readFile(path.replace(/\.json$/, '.bin'));
  for (const part of manifest.parts) {
    const description = material.parts.find((candidate) => candidate.id === part.id);
    assert(description, 'Missing material state');
    const key = { asset: relative(root, path), part: part.id, label: description.label };
    if (baseIds?.has(part.id)) {
      skipped.push({ ...key, reason: 'base geometry is not drawn twice during work' });
      continue;
    }
    if (
      [
        description,
        ...variants.map((variant) => variant.parts.find((candidate) => candidate.id === part.id)),
      ].some(
        (state) =>
          !state || state.transparent || state.depthWrite === false || state.depthTest === false,
      )
    ) {
      skipped.push({ ...key, reason: 'transparent or order-dependent render state' });
      continue;
    }
    const values = [];
    for (const range of part.indices) {
      assert.equal(range.componentType, 'uint16');
      assert.equal(range.count % 3, 0);
      const indices = new Uint16Array(
        buffer.buffer,
        buffer.byteOffset + range.byteOffset,
        range.count,
      );
      for (const value of indices) values.push(value);
    }
    if (!values.length) continue;
    const source = Uint32Array.from(values),
      optimized = source.slice();
    const [remap, unique] = MeshoptEncoder.reorderMesh(optimized, true, false);
    const inverse = new Uint32Array(unique);
    for (let old = 0; old < remap.length; old++) if (remap[old] < unique) inverse[remap[old]] = old;
    for (let i = 0; i < optimized.length; i++) optimized[i] = inverse[optimized[i]];
    assert.deepEqual(
      triangles(optimized),
      triangles(source),
      'Every original oriented triangle must remain, with original vertex IDs',
    );
    const estimates = {};
    for (const size of [16, 32])
      for (const policy of ['fifo', 'lru']) {
        const before = model(source, size, policy === 'lru'),
          after = model(optimized, size, policy === 'lru');
        estimates[`${policy}${size}`] = {
          before,
          after,
          beforeACMR: before / (source.length / 3),
          afterACMR: after / (source.length / 3),
        };
      }
    const group = catalogComputer
      ? 'catalog-work'
      : computer
        ? 'authored-work'
        : path.includes('/catalog-library/')
          ? path.includes('/high/')
            ? 'catalog-high'
            : 'catalog-low'
          : path.endsWith('geometry-low.json')
            ? 'authored-low'
            : 'authored-high';
    records.push({
      ...key,
      group,
      triangles: source.length / 3,
      referencedVertices: unique,
      estimates,
    });
  }
}
const groups = {};
for (const record of records) {
  const group = (groups[record.group] ??= { parts: 0, triangles: 0, estimates: {} });
  group.parts++;
  group.triangles += record.triangles;
  for (const [key, value] of Object.entries(record.estimates)) {
    const estimate = (group.estimates[key] ??= { before: 0, after: 0 });
    estimate.before += value.before;
    estimate.after += value.after;
  }
}
for (const group of Object.values(groups))
  for (const estimate of Object.values(group.estimates)) {
    estimate.beforeACMR = estimate.before / group.triangles;
    estimate.afterACMR = estimate.after / group.triangles;
    estimate.estimatedMissReduction = 1 - estimate.after / estimate.before;
  }
const report = {
  method:
    'meshoptimizer 1.1.1 cache reorder only; inverse vertex-fetch remap restores original vertex IDs; exact oriented-triangle multiset validated; FIFO/LRU16/32 estimates, not measured GPU invocations',
  groups,
  skipped: skipped.length,
  records,
};
const output = process.env.AVATAR_VERTEX_CACHE_OUTPUT || '.local/avatar-vertex-cache';
await mkdir(output, { recursive: true });
await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify({
    method: report.method,
    groups,
    skipped: skipped.length,
    top: records
      .sort(
        (a, b) =>
          b.estimates.lru16.before -
          b.estimates.lru16.after -
          (a.estimates.lru16.before - a.estimates.lru16.after),
      )
      .slice(0, 8)
      .map(({ asset, part, triangles, estimates }) => ({
        asset,
        part,
        triangles,
        lru16: estimates.lru16,
      })),
  }),
);
