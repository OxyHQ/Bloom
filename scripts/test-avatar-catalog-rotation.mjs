import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { InstancedBufferGeometry, Float32BufferAttribute, Vector3 } from 'three';
const dir = await mkdtemp('.local/catalog-rotation-test-');
await writeFile(
  `${dir}/fitting.mjs`,
  ts.transpileModule(await readFile('runtime/avatar/catalog-fitting.ts', 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText,
);
const { transformCatalogPiece, catalogPieceMatrix } = await import(
  pathToFileURL(`${process.cwd()}/${dir}/fitting.mjs`)
);
test.after(() => rm(dir, { recursive: true, force: true }));
function fixture(fur = false) {
  const geometry = new InstancedBufferGeometry();
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute([-0.3, 0.2, 0.1, 0.8, 0.1, -0.2, 0.1, 1.1, 0.3], 3),
  );
  for (const name of ['normal', 'normal0', 'normal1', 'delta0', 'delta1'])
    geometry.setAttribute(
      name,
      new Float32BufferAttribute([0.2, 0.7, 0.3, 0.4, -0.1, 0.8, -0.3, 0.8, 0.1], 3),
    );
  geometry.setAttribute(
    'paletteGeometry',
    new Float32BufferAttribute([2, 0.2, 0.7, 0.3, 3, 0.4, -0.1, 0.8, 4, -0.3, 0.8, 0.1], 4),
  );
  geometry.computeBoundingBox();
  return {
    id: 1,
    category: 'accessory',
    attachment: 'three_lobe',
    universal: false,
    fur,
    geometry,
    bounds: {
      min: geometry.boundingBox.min.toArray(),
      max: geometry.boundingBox.max.toArray(),
    },
    pivot: [0.1, 0.2, 0.3],
    attachmentPivot: [0.2, 0.3, 0.4],
    fields: {
      paletteBounds: [0.2, 0.4, 2, 3],
      eyeCurveOriginAmount: [0, 0, 0, 0],
    },
  };
}
const read = (g, n, i) => new Vector3().fromBufferAttribute(g.getAttribute(n), i);
for (const fur of [false, true])
  test(`rotation ${fur ? 'fur' : 'surface'} preserves directions/morphs and computes real bounds around origin`, () => {
    const part = fixture(fur),
      transform = {
        scale: 1.3,
        rotationZ: 0.63,
        origin: [0.17, 0.32, -0.08],
        translate: [0.2, -0.1, 0.3],
      },
      before = Object.fromEntries(
        Object.entries(part.geometry.attributes).map(([n, a]) => [n, Array.from(a.array)]),
      ),
      result = transformCatalogPiece(part, transform),
      F = catalogPieceMatrix(transform),
      direction = (v) => {
        const c = Math.cos(transform.rotationZ),
          s = Math.sin(transform.rotationZ);
        return new Vector3(c * v.x - s * v.y, s * v.x + c * v.y, v.z);
      };
    const points = [];
    for (let i = 0; i < 3; i++) {
      const p = read(part.geometry, 'position', i).applyMatrix4(F);
      points.push(p);
      assert(read(result.geometry, 'position', i).distanceTo(p) < 8e-8);
      for (const name of fur
        ? ['normal', 'normal0', 'delta1']
        : ['normal', 'normal0', 'normal1', 'delta0', 'delta1']) {
        const expected = direction(read(part.geometry, name, i));
        if (!fur && name.startsWith('delta')) expected.multiplyScalar(transform.scale);
        assert(read(result.geometry, name, i).distanceTo(expected) < 8e-8, name);
      }
      const a = result.geometry.getAttribute('paletteGeometry'),
        b = part.geometry.getAttribute('paletteGeometry');
      assert.equal(a.getX(i), b.getX(i));
      if (fur) for (let k = 0; k < 4; k++) assert.equal(a.array[4 * i + k], b.array[4 * i + k]);
      else {
        const n = direction(new Vector3(b.getY(i), b.getZ(i), b.getW(i)));
        assert(new Vector3(a.getY(i), a.getZ(i), a.getW(i)).distanceTo(n) < 8e-8);
      }
    }
    for (let k = 0; k < 3; k++) {
      assert.equal(
        result.bounds.min[k],
        Math.min(...points.map((p) => Math.fround(p.getComponent(k)))),
      );
      assert.equal(
        result.bounds.max[k],
        Math.max(...points.map((p) => Math.fround(p.getComponent(k)))),
      );
    }
    for (const key of ['pivot', 'attachmentPivot'])
      assert(
        new Vector3()
          .fromArray(result[key])
          .distanceTo(new Vector3().fromArray(part[key]).applyMatrix4(F)) < 8e-8,
      );
    for (const [n, a] of Object.entries(part.geometry.attributes))
      assert.deepEqual(Array.from(a.array), before[n]);
    assert.notEqual(result.geometry, part.geometry);
  });
test('omitting rotation and explicit zero produce byte-identical legacy transform', () => {
  const part = fixture(),
    base = {
      scale: 0.77,
      origin: [0.4, 0.1, -0.3],
      translate: [0.2, 0.6, 0.1],
    },
    a = transformCatalogPiece(part, base),
    b = transformCatalogPiece(part, { ...base, rotationZ: 0 });
  for (const [n, attr] of Object.entries(a.geometry.attributes))
    assert.deepEqual(Array.from(attr.array), Array.from(b.geometry.getAttribute(n).array));
  assert.deepEqual(a.bounds, b.bounds);
  assert.deepEqual(a.fields, b.fields);
  assert.deepEqual(
    catalogPieceMatrix(base).elements,
    catalogPieceMatrix({ ...base, rotationZ: 0 }).elements,
  );
});
test('unsupported palette and eye rotations fail explicitly instead of silently changing shader coordinates', () => {
  const base = fixture(),
    fit = { scale: 1, origin: [0, 0, 0], translate: [0, 0, 0], rotationZ: 0.1 };
  assert.throws(() => transformCatalogPiece({ ...base, universal: true }, fit), /FELIPE Tuft/);
  assert.throws(
    () => transformCatalogPiece({ ...base, category: 'eyes', attachment: 'eyes' }, fit),
    /FELIPE Tuft/,
  );
  assert.throws(
    () => transformCatalogPiece(base, { ...fit, rotationZ: NaN }),
    /invalid part transform/,
  );
});
