import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import * as THREE from 'three';
import ts from 'typescript';

const temporary = await mkdtemp('.local/avatar-index-buffer-');
await writeFile(
  `${temporary}/index-buffer.mjs`,
  ts.transpileModule(await readFile('runtime/avatar/index-buffer.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText,
);
const { decodeIndexBuffer } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/index-buffer.mjs`).href
);
test.after(() => rm(temporary, { recursive: true, force: true }));
function original(binary, ranges) {
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(
    ranges.flatMap((range) =>
      Array.from(
        range.componentType === 'uint16'
          ? new Uint16Array(binary, range.byteOffset, range.count)
          : new Uint32Array(binary, range.byteOffset, range.count),
      ),
    ),
  );
  return geometry.index.array;
}
const records = [];
for (const path of await readdir('runtime/avatar/assets', { recursive: true })) {
  if (!/(^|\/)(computer-geometry|geometry|geometry-low)\.json$/.test(path)) continue;
  const manifest = JSON.parse(await readFile(`runtime/avatar/assets/${path}`, 'utf8'));
  const buffer = await readFile(`runtime/avatar/assets/${path.replace(/\.json$/, '.bin')}`);
  const binary = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  for (const part of manifest.parts)
    records.push({ path, id: part.id, binary, ranges: part.indices });
}

test('all authored and catalog index bytes, order and component widths match Three', () => {
  assert(records.length > 100);
  for (const { path, id, binary, ranges } of records) {
    const expected = original(binary, ranges);
    const actual = decodeIndexBuffer(binary, ranges);
    assert.deepEqual(actual, expected, `${path} part ${id}`);
    assert.equal(actual.constructor, expected.constructor, `${path} part ${id} width`);
    assert.deepEqual(
      new Uint8Array(actual.buffer, actual.byteOffset, actual.byteLength),
      new Uint8Array(expected.buffer, expected.byteOffset, expected.byteLength),
    );
  }
});

test('primitive restart boundary, mixed ranges, zero ranges and narrowing preserve existing semantics', () => {
  for (const groups of [
    [],
    [[0, 65534]],
    [[65535]],
    [[65536, 1]],
    [
      [1, 2],
      [3, 65535],
    ],
    [[65534], [0]],
  ]) {
    const binary = new ArrayBuffer(128);
    let offset = 0;
    const ranges = groups.map((values, index) => {
      const wide = index % 2 === 0;
      const View = wide ? Uint32Array : Uint16Array;
      new View(binary, offset, values.length).set(values);
      const range = {
        byteOffset: offset,
        count: values.length,
        componentType: wide ? 'uint32' : 'uint16',
      };
      offset += 32;
      return range;
    });
    const before = binary.slice(0);
    assert.deepEqual(decodeIndexBuffer(binary, ranges), original(binary, ranges));
    assert.deepEqual(binary, before);
  }
});

if (process.env.AVATAR_INDEX_BENCHMARK)
  test('report alternating whole-catalog decode timings', async () => {
    let consumed = 0;
    const run = (decode) => {
      const start = performance.now();
      for (const { binary, ranges } of records) consumed += decode(binary, ranges).length;
      return performance.now() - start;
    };
    for (let warm = 0; warm < 2; warm++) {
      run(original);
      run(decodeIndexBuffer);
    }
    const before = [],
      after = [];
    for (let repeat = 0; repeat < 7; repeat++) {
      if (repeat % 2) {
        after.push(run(decodeIndexBuffer));
        before.push(run(original));
      } else {
        before.push(run(original));
        after.push(run(decodeIndexBuffer));
      }
    }
    const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
    const report = {
      date: '2026-10-31',
      scope:
        'Node CPU index decode only; file reads excluded; same input/order/index width. Not whole startup or FPS.',
      parts: records.length,
      indices: records.reduce(
        (total, r) => total + r.ranges.reduce((count, range) => count + range.count, 0),
        0,
      ),
      beforeMs: before,
      afterMs: after,
      beforeMedianMs: median(before),
      afterMedianMs: median(after),
      consumed,
    };
    await writeFile(
      `${process.env.AVATAR_INDEX_BENCHMARK}`,
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(report);
  });
