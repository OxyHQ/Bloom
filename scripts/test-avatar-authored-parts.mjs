import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authoredAssemblyRecords,
  translateAuthoredRecord,
  transformAuthoredRecord,
  composeAuthoredParts,
} from '../assets/character-runtime/authored-parts.mjs';
import { encodeAppearance } from '../assets/character-runtime/appearance-codec.mjs';

// Bounded record fixture exercises serialization, not the original renderer.
// Real source materials/meshes/pixels are checked by the browser gate.
function fixture(
  activityBytes = 0,
  prefixBytes = 24,
  meshName = 'a'.repeat(64) + ':body:no-shadow:studio-fur-v6:',
) {
  const name = new TextEncoder().encode(meshName);
  const start = 4,
    nameOffset = start + prefixBytes + 4;
  const vertices = nameOffset + name.length + 4;
  const flags = vertices + 3 * 96 + 4 + 3 * 4 + 4;
  const fur = flags + 7 + 4;
  const geometryEnd = fur + 64;
  const end = geometryEnd + 27;
  const bytes = new Uint8Array(end + 160 + activityBytes);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 1, true);
  for (let k = 0; k < 6; k++)
    view.setFloat32(start + k * 4, k < 3 ? -1 : 1, true);
  view.setUint32(nameOffset - 4, name.length, true);
  bytes.set(name, nameOffset);
  view.setUint32(vertices - 4, 3, true);
  view.setUint32(vertices + 3 * 96, 3, true);
  [0, 1, 2].forEach((value, i) =>
    view.setUint32(vertices + 3 * 96 + 4 + i * 4, value, true),
  );
  bytes[flags + 6] = 1;
  view.setUint32(fur - 4, 1, true);
  view.setUint32(geometryEnd, 3, true);
  view.setUint32(geometryEnd + 4, 3, true);
  return { bytes, view, start, nameOffset, vertices, fur, geometryEnd, end };
}

test('complete records include material prefixes and all 27 descriptor bytes', () => {
  const f = fixture();
  const result = authoredAssemblyRecords(f.bytes);
  assert.equal(result.records[0].start, 4);
  assert.equal(result.records[0].end, f.end);
  assert.equal(result.records[0].geometryEnd, f.geometryEnd);
  assert.equal(result.body, result.records[0]);
  assert.equal(result.body.start, 4);
  assert.equal(result.body.end, f.end);
  assert.deepEqual(result.footer, f.bytes.slice(f.end));
});

test('opaque original activity assemblies survive a multi-megabyte footer', () => {
  const f = fixture(2600000);
  f.bytes[f.end + 2400000] = 73;
  const result = authoredAssemblyRecords(f.bytes);
  assert.equal(result.footer.length, 2600160);
  assert.equal(result.footer[2400000], 73);
  result.footer[2400000] = 0;
  assert.equal(f.bytes[f.end + 2400000], 73);
});

test('malformed descriptors and bounds fail before reaching native rendering', () => {
  for (const mutate of [
    (f) => f.view.setUint32(f.geometryEnd, 4, true),
    (f) => f.view.setUint32(f.geometryEnd + 4, 4, true),
    (f) => (f.bytes[f.geometryEnd + 8] = 2),
    (f) => f.view.setFloat32(f.geometryEnd + 11, NaN, true),
    (f) => f.view.setFloat32(f.start, 2, true),
    (f) => f.view.setFloat32(f.start, Infinity, true),
    (f) => f.view.setFloat32(f.fur + 12, NaN, true),
  ]) {
    const f = fixture();
    mutate(f);
    assert.throws(() => authoredAssemblyRecords(f.bytes));
  }
});

test('fitted records move the native deformation anchor with geometry and retain other fields', async () => {
  const f = fixture(0, 72);
  f.view.setUint32(f.start + 24, 1, true);
  [0.4, 0.5, 0.6].forEach((value, k) =>
    f.view.setFloat32(f.start + 40 + k * 4, value, true),
  );
  f.view.setFloat32(f.vertices + 12, 0.7, true); // source normal, untouched
  f.view.setFloat32(f.vertices + 24, 0.25, true); // source morph delta, untouched
  const original = f.bytes.slice(),
    source = authoredAssemblyRecords(f.bytes).body;
  const translate = [0.2, -0.3, 0.4];
  const result = await translateAuthoredRecord(f.bytes, source, translate);
  const view = new DataView(result.bytes.buffer);
  for (let k = 0; k < 3; k++) {
    assert.equal(
      view.getFloat32(40 + k * 4, true),
      Math.fround(f.view.getFloat32(f.start + 40 + k * 4, true) + translate[k]),
    );
    assert.equal(
      view.getFloat32(f.vertices - f.start + k * 4, true),
      Math.fround(translate[k]),
    );
  }
  assert.equal(
    view.getFloat32(f.vertices - f.start + 12, true),
    f.view.getFloat32(f.vertices + 12, true),
  );
  assert.equal(view.getFloat32(f.vertices - f.start + 24, true), 0.25);
  assert.equal(result.bytes.length, source.end - source.start);
  assert.notEqual(result.name, source.name);
  assert.deepEqual(f.bytes, original);
  await assert.rejects(
    translateAuthoredRecord(f.bytes, source, [NaN, 0, 0]),
    /non-finite translated/,
  );
});

test('recognized beret attachment centers follow the fitted geometry', async () => {
  const f = fixture(0, 120);
  f.view.setUint32(f.start + 24, 1, true);
  for (const offset of [40, 96])
    [0.4, 0.5, 0.6].forEach((value, k) =>
      f.view.setFloat32(f.start + offset + k * 4, value, true),
    );
  f.view.setUint32(f.start + 108, 5, true);
  f.bytes.set(new TextEncoder().encode('beret'), f.start + 112);
  f.bytes.set([1, 1, 7, 0], f.start + 92);
  const source = authoredAssemblyRecords(f.bytes).body;
  const result = await translateAuthoredRecord(
    f.bytes,
    source,
    [0.2, 0.3, 0.4],
  );
  const view = new DataView(result.bytes.buffer);
  for (let k = 0; k < 3; k++)
    assert.equal(
      view.getFloat32(96 + k * 4, true),
      view.getFloat32(40 + k * 4, true),
    );
  // Generic hat centers need not match their attachment pivot.
  f.view.setFloat32(f.start + 96, 7, true);
  const other = await translateAuthoredRecord(f.bytes, source, [0.2, 0.3, 0.4]);
  assert.equal(
    new DataView(other.bytes.buffer).getFloat32(96, true),
    Math.fround(7.2),
  );
  // A different optional-field layout is not rewritten merely by position.
  f.bytes[f.start + 94] = 0;
  const unknown = await translateAuthoredRecord(
    f.bytes,
    source,
    [0.2, 0.3, 0.4],
  );
  assert.equal(new DataView(unknown.bytes.buffer).getFloat32(96, true), 7);
});

test('native eyewear frame pivots move without rewriting classification flags', async () => {
  const f = fixture(0, 160),
    label = new TextEncoder().encode('tall_oval_frames');
  f.view.setUint32(f.start + 24, 1, true);
  f.bytes.set([1, 1, 1, 1], f.start + 92);
  f.view.setFloat32(f.start + 96, 0, true);
  f.view.setFloat32(f.start + 100, 0.2, true);
  f.view.setFloat32(f.start + 104, 0.875, true);
  f.view.setUint32(f.start + 108, label.length, true);
  f.bytes.set(label, f.start + 112);
  const result = await translateAuthoredRecord(
    f.bytes,
    authoredAssemblyRecords(f.bytes).body,
    [0, 0.4, -0.1],
  );
  const view = new DataView(result.bytes.buffer);
  assert.equal(
    view.getFloat32(100, true),
    Math.fround(f.view.getFloat32(f.start + 100, true) + 0.4),
  );
  assert.equal(view.getFloat32(104, true), Math.fround(0.775));
  assert.deepEqual(Array.from(result.bytes.slice(92, 96)), [1, 1, 1, 1]);
});

test('uniform fitting scales pose deltas and bounds while retaining normals and material values', async () => {
  const f = fixture(0, 120);
  f.view.setUint32(f.start + 24, 1, true);
  [0.4, 0.5, 0.6].forEach((v, k) =>
    f.view.setFloat32(f.start + 40 + k * 4, v, true),
  );
  f.view.setFloat32(f.start + 28, 0.27, true);
  f.view.setFloat32(f.vertices + 12, 0.8, true);
  f.view.setFloat32(f.vertices + 24, 0.25, true);
  f.view.setFloat32(f.vertices + 48, -0.5, true);
  const original = f.bytes.slice(),
    part = authoredAssemblyRecords(f.bytes).body;
  const fitted = await transformAuthoredRecord(f.bytes, part, {
    scale: 0.5,
    origin: [0, 1, 0],
    translate: [0.2, 0.3, 0.4],
  });
  const view = new DataView(fitted.bytes.buffer),
    at = f.vertices - f.start;
  assert.equal(view.getFloat32(at + 24, true), 0.125);
  assert.equal(view.getFloat32(at + 48, true), -0.25);
  assert.equal(
    view.getFloat32(at + 12, true),
    f.view.getFloat32(f.vertices + 12, true),
  );
  assert.equal(
    view.getFloat32(28, true),
    f.view.getFloat32(f.start + 28, true),
  );
  assert.equal(view.getFloat32(at + 4, true), Math.fround(0.8));
  assert.equal(view.getFloat32(44, true), Math.fround(1.05));
  assert.deepEqual(f.bytes, original);
  assert.notEqual(
    fitted.name,
    (await transformAuthoredRecord(f.bytes, part, { scale: 0.6 })).name,
  );
  for (const scale of [0, -1, NaN, Infinity])
    await assert.rejects(transformAuthoredRecord(f.bytes, part, { scale }));
});

test('Todd eye diameter follows equal-size bodies independently from their native interocular spacing', async () => {
  function assembly(gap, source) {
    const body = fixture(0, 144),
      parts = [body];
    body.view.setUint32(body.start + 24, 1, true);
    for (let vertex = 0; vertex < 3; vertex++)
      for (let k = 0; k < 3; k++)
        body.view.setFloat32(
          body.vertices + vertex * 96 + k * 4,
          vertex === 0 ? -1 : vertex === 1 ? 1 : 0,
          true,
        );
    for (const sign of [-1, 1])
      for (let layer = 0; layer < (source ? 2 : 1); layer++) {
        const part = fixture(
          0,
          144,
          String(parts.length).repeat(64) + ':surface:shadow',
        );
        const label = new TextEncoder().encode(
          source ? 'source_integrated_eye' : 'oval',
        );
        part.view.setUint32(part.start + 24, 1, true);
        part.view.setUint32(part.start + 112, label.length, true);
        part.bytes.set(label, part.start + 116);
        const width = source ? (layer ? 0.24 : 0.344) : 0.2,
          center = (sign * gap) / 2;
        const min = [center - width / 2, 0.3, 0.42 + layer * 0.15],
          max = [center + width / 2, 0.68, 0.6 + layer * 0.003];
        for (let k = 0; k < 3; k++) {
          part.view.setFloat32(part.start + k * 4, min[k], true);
          part.view.setFloat32(part.start + 12 + k * 4, max[k], true);
        }
        for (let vertex = 0; vertex < 3; vertex++)
          for (let k = 0; k < 3; k++)
            part.view.setFloat32(
              part.vertices + vertex * 96 + k * 4,
              vertex === 0
                ? min[k]
                : vertex === 1
                  ? max[k]
                  : (min[k] + max[k]) / 2,
              true,
            );
        parts.push(part);
      }
    const size = 4 + parts.reduce((sum, p) => sum + p.end - p.start, 0) + 160,
      bytes = new Uint8Array(size);
    new DataView(bytes.buffer).setUint32(0, parts.length, true);
    let at = 4;
    for (const p of parts) {
      bytes.set(p.bytes.subarray(p.start, p.end), at);
      at += p.end - p.start;
    }
    return bytes;
  }
  const source = assembly(0.92, true);
  const module = {
    presetAppearance: () => new Uint8Array(),
    orbitPrepareAssembly: () => ({ bytes: source }),
  };
  const appearance = encodeAppearance({
    version: 1,
    shape: 'circle',
    color: 'blue',
    eyes: 'oval',
    eyewear: 'none',
    accessories: [],
    accessoryColors: {},
    constrained: 0,
    depth: 0.5,
    model: null,
    rig: null,
    hereCharacter: null,
  });
  for (const gap of [0.2, 0.41, 0.92]) {
    const bytes = await composeAuthoredParts(module, assembly(gap, false), {
      appearance,
      quality: 0,
      key: 'fixture',
      activities: false,
      authoredParts: { eyes: 'todd' },
    });
    const eyes = authoredAssemblyRecords(bytes).records.slice(1);
    assert.equal(eyes.length, 4);
    for (const eye of [eyes[0], eyes[2]]) {
      assert.ok(
        Math.abs(eye.bounds.max[0] - eye.bounds.min[0] - 0.344) < 1e-6,
        'white eye remains full authored width',
      );
      assert.ok(
        Math.abs(eye.bounds.max[2] - eye.bounds.min[2] - 0.18) < 1e-6,
        'eye depth remains visible',
      );
      assert.ok(
        Math.abs(
          Math.abs((eye.bounds.min[0] + eye.bounds.max[0]) / 2) - gap / 2,
        ) < 1e-6,
        'independent centers use requested reference gap',
      );
    }
  }
});
