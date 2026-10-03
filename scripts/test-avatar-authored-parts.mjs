import assert from "node:assert/strict";
import test from "node:test";
import {
  authoredAssemblyRecords,
  translateAuthoredRecord,
} from "../assets/character-runtime/authored-parts.mjs";

// Bounded record fixture exercises serialization, not the original renderer.
// Real source materials/meshes/pixels are checked by the browser gate.
function fixture(activityBytes = 0, prefixBytes = 24) {
  const name = new TextEncoder().encode(
    "a".repeat(64) + ":body:no-shadow:studio-fur-v6:",
  );
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

test("complete records include material prefixes and all 27 descriptor bytes", () => {
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

test("opaque original activity assemblies survive a multi-megabyte footer", () => {
  const f = fixture(2600000);
  f.bytes[f.end + 2400000] = 73;
  const result = authoredAssemblyRecords(f.bytes);
  assert.equal(result.footer.length, 2600160);
  assert.equal(result.footer[2400000], 73);
  result.footer[2400000] = 0;
  assert.equal(f.bytes[f.end + 2400000], 73);
});

test("malformed descriptors and bounds fail before reaching native rendering", () => {
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

test("fitted records move the native deformation anchor with geometry and retain other fields", async () => {
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

test("recognized beret attachment centers follow the fitted geometry", async () => {
  const f = fixture(0, 120);
  f.view.setUint32(f.start + 24, 1, true);
  for (const offset of [40, 96])
    [0.4, 0.5, 0.6].forEach((value, k) =>
      f.view.setFloat32(f.start + offset + k * 4, value, true),
    );
  f.view.setUint32(f.start + 108, 5, true);
  f.bytes.set(new TextEncoder().encode("beret"), f.start + 112);
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

test("native eyewear frame pivots move without rewriting classification flags", async () => {
  const f = fixture(0, 160),
    label = new TextEncoder().encode("tall_oval_frames");
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
