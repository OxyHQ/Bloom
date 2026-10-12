/** Isolated-eye calibration repairs cross-record closure-material references in
 * diagnostic combined rigs. It changes exported semantic material channels,
 * never native assets or the replacement renderer. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { channel } from './build-avatar-catalog-motion.mjs';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const vector = (d) => [...d.slice(32, 36), d[36]];
const distance = (a, b) => a.reduce((v, x, k) => v + (x - b[k]) ** 2, 0);
const matrixVectors = (clipPart) => clipPart.fields;
function values(c, i) {
  return 'value' in c
    ? Array.from(c.value)
    : Array.from(c.samples.slice(i * 4, i * 4 + 4));
}
const cache = new Map();
export async function calibrateCatalogMaterials(
  observation,
  sourceRaw,
  manifest,
) {
  const reports = [];
  for (const record of manifest.parts.filter((p) => p.category === 'eyes')) {
    let isolated = cache.get(record.selection);
    if (!isolated) {
      isolated = await read(
        `.local/avatar-catalog-material-roles/${record.selection}/idle-raw.json`,
      );
      cache.set(record.selection, isolated);
    }
    const part = observation.clip.parts.find(
      (p) => p.id === `mesh:${record.id}`,
    );
    assert(part);
    const source = sourceRaw.frames.filter(
      (f) => f.renderTime >= 2 && f.renderTime <= 4,
    );
    const nativeMap = new Map(
      isolated.frames.map((f) => [Math.round(f.renderTime * 60), f]),
    );
    assert(
      source.length >= 61,
      'Material calibration needs a complete observed blink',
    );
    // The native scene submits surfaces in record order, then fur. Validate the
    // entire matched morph timeline as an independent discriminator of identity.
    const vectors = source.map((f) =>
      vector(f.draws[record.id].blocks.DrawBlock),
    );
    const expected = source.map((f) => {
      const frame = nativeMap.get(Math.round(f.renderTime * 60));
      assert(frame);
      return vector(frame.draws[record.sourcePart].blocks.DrawBlock);
    });
    for (const [i, f] of source.entries()) {
      const target = nativeMap.get(Math.round(f.renderTime * 60)).draws[
        record.sourcePart
      ];
      const actual = f.draws[record.id];
      assert.deepEqual(
        actual.blocks.DrawBlock.slice(38, 40),
        target.blocks.DrawBlock.slice(38, 40),
        `Eye identity/morph ${record.selection}/${record.sourcePart}/${i}`,
      );
    }
    const open = vectors[0],
      targetOpen = expected[0];
    let end = 0;
    for (let i = 1; i < vectors.length; i++)
      if (distance(vectors[i], open) > distance(vectors[end], open)) end = i;
    const close = vectors[end],
      targetClose = expected[end];
    let axis = 0;
    for (let k = 1; k < 5; k++)
      if (Math.abs(close[k] - open[k]) > Math.abs(close[axis] - open[axis]))
        axis = k;
    const span = close[axis] - open[axis];
    if (Math.abs(span) < 1e-9)
      assert(
        expected.every((v) => distance(v, targetOpen) === 0),
        `Missing material blend signal ${record.selection}`,
      );
    const correct = (v) => {
      const weight = Math.abs(span) < 1e-9 ? 0 : (v[axis] - open[axis]) / span;
      assert(
        weight >= -2e-6 && weight <= 1 + 2e-6,
        'Unobserved closure material extrapolation',
      );
      for (let k = 0; k < 5; k++)
        assert(
          Math.abs(v[k] - (open[k] + (close[k] - open[k]) * weight)) <= 2e-7,
          'Nonlinear/extra material channel',
        );
      return targetOpen.map((x, k) =>
        Math.fround(x + (targetClose[k] - x) * weight),
      );
    };
    let max = 0;
    for (let i = 0; i < vectors.length; i++)
      for (const [k, v] of correct(vectors[i]).entries())
        max = Math.max(max, Math.abs(v - expected[i][k]));
    assert(
      max <= 2.4e-7,
      `Isolated material calibration ${record.selection}/${record.sourcePart}: ${max}`,
    );
    const colors = [],
      parameters = [];
    for (let i = 0; i < observation.clip.times.length; i++) {
      const c = values(part.fields.colorRoughness, i),
        p = values(part.fields.parameters, i),
        v = correct([...c, p[0]]);
      colors.push(v.slice(0, 4));
      parameters.push([v[4], ...p.slice(1)]);
    }
    part.fields.colorRoughness = channel(colors);
    part.fields.parameters = channel(parameters);
    reports.push({
      selection: record.selection,
      part: record.sourcePart,
      max,
      sourceOpen: open,
      sourceClosed: close,
      targetOpen,
      targetClosed: targetClose,
    });
  }
  return reports;
}
