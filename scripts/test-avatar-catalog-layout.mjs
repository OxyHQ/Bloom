/** Art-directed layouts against every shipped low/high body surface, without GPU. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { InstancedBufferGeometry, Float32BufferAttribute, Triangle, Vector3 } from 'three';
const root = 'runtime/avatar';
const assets = `${root}/assets/catalog-library`;
const directory = await mkdtemp('.local/catalog-layout-test-');
for (const name of ['catalog-fitting', 'catalog-layout']) {
  const result = ts
    .transpileModule(await readFile(`${root}/${name}.ts`, 'utf8'), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    })
    .outputText.replaceAll("'./catalog-fitting'", "'./catalog-fitting.mjs'");
  await writeFile(`${directory}/${name}.mjs`, result);
}
const {
  bodyFront,
  fitCatalogPieces,
  seatCatalogAccessories,
  closestBodySurface,
  catalogPieceMatrix,
  transformCatalogPiece,
} = await import(pathToFileURL(`${process.cwd()}/${directory}/catalog-fitting.mjs`));
const { CATALOG_LAYOUTS, catalogLayout, fitCatalogFace } = await import(
  pathToFileURL(`${process.cwd()}/${directory}/catalog-layout.mjs`)
);
const library = JSON.parse(await readFile(`${assets}/index.json`, 'utf8'));
const geometries = [];
test.after(async () => {
  for (const geometry of geometries) geometry.dispose();
  await rm(directory, { recursive: true, force: true });
});
async function assembly(entry, detail) {
  const path = `${assets}/${entry[detail]}`;
  const [manifest, material, bytes] = await Promise.all([
    readFile(`${path}/geometry.json`, 'utf8').then(JSON.parse),
    readFile(`${path}/material.json`, 'utf8').then(JSON.parse),
    readFile(`${path}/geometry.bin`),
  ]);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const pieces = manifest.parts
    .filter((part) => part.id === 0 || entry.selectedPartIds.includes(part.id))
    .map((part) => {
      const geometry = new InstancedBufferGeometry();
      geometries.push(geometry);
      const positions = new Float32Array(part.vertices.count * 3);
      for (let i = 0; i < part.vertices.count; i++)
        for (let k = 0; k < 3; k++)
          positions[i * 3 + k] = view.getFloat32(
            part.vertices.byteOffset + i * part.vertices.byteStride + k * 4,
            true,
          );
      geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
      const indices = [];
      for (const block of part.indices)
        for (let i = 0; i < block.count; i++)
          indices.push(
            block.componentType === 'uint16'
              ? view.getUint16(block.byteOffset + i * 2, true)
              : view.getUint32(block.byteOffset + i * 4, true),
          );
      geometry.setIndex(indices);
      const metadata = material.parts.find((value) => value.id === part.id);
      return {
        ...metadata,
        selection:
          metadata.selection ??
          (entry.selectedPartIds.includes(part.id) ? entry[detail].split('/')[1] : ''),
        geometry,
        fur: false,
      };
    });
  return {
    body: pieces.find((part) => part.id === 0),
    pieces,
    face: structuredClone(entry.face.centers ? entry.face : entry.face[detail]),
  };
}
function snapshot(source) {
  return source.pieces
    .map(({ geometry, ...metadata }) => ({
      metadata: JSON.stringify(metadata),
      positions: Buffer.from(geometry.getAttribute('position').array.buffer),
      indices: Buffer.from(geometry.getIndex().array.buffer),
    }))
    .map((value) => ({
      ...value,
      positions: Buffer.from(value.positions),
      indices: Buffer.from(value.indices),
    }));
}
function assertUnchanged(source, before, face) {
  assert.equal(JSON.stringify(source.face), face);
  const after = snapshot(source);
  for (let i = 0; i < before.length; i++) {
    assert.equal(after[i].metadata, before[i].metadata);
    assert.ok(after[i].positions.equals(before[i].positions), 'source positions changed');
    assert.ok(after[i].indices.equals(before[i].indices), 'source indices changed');
  }
}
function distanceToTriangles(part, point) {
  const p = part.geometry.getAttribute('position'),
    index = part.geometry.getIndex();
  const triangle = new Triangle(),
    query = new Vector3().fromArray(point),
    closest = new Vector3();
  let result = Infinity;
  for (let i = 0; i < index.count; i += 3) {
    triangle.a.fromBufferAttribute(p, index.getX(i));
    triangle.b.fromBufferAttribute(p, index.getX(i + 1));
    triangle.c.fromBufferAttribute(p, index.getX(i + 2));
    triangle.closestPointToPoint(query, closest);
    result = Math.min(result, query.distanceTo(closest));
  }
  return result;
}
const cases = [];
for (const detail of ['low', 'high']) {
  const donor = await assembly(library.donors.accessory.three_lobe, detail);
  for (const [shape, entry] of Object.entries(library.donors.body))
    cases.push({ shape, detail, donor, source: await assembly(entry, detail) });
}
test('all 20 silhouettes have profiles; Todd is an explicit alias', () => {
  assert.equal(Object.keys(CATALOG_LAYOUTS).length, 20);
  assert.deepEqual(
    Object.keys(CATALOG_LAYOUTS).sort(),
    Object.keys(library.donors.body)
      .filter((shape) => shape !== 'todd')
      .sort(),
  );
  assert.strictEqual(catalogLayout('todd'), catalogLayout('rounded_head_two_ears'));
  assert.throws(() => catalogLayout('missing'), /Missing avatar layout/);
});
for (const { shape, detail, donor, source } of cases) {
  test(`${shape}/${detail}: face fits the surface and preserves its source`, () => {
    const before = snapshot(source),
      originalFace = JSON.stringify(source.face);
    const face = fitCatalogFace(source, shape);
    assert.ok(Number.isFinite(face.radius) && face.radius > 0);
    assert.equal(face.centers.length, 2);
    for (const center of face.centers) {
      assert.ok(center.every(Number.isFinite));
      if (shape !== 'clippo') {
        const front = bodyFront(source, center[0], center[1]);
        assert.ok(Number.isFinite(front), 'face must land on the actual body');
        assert.ok(Math.abs(center[2] - (front - face.radius * 0.3)) < 1e-14);
      }
    }
    if (shape === 'clippo')
      assert.strictEqual(face, source.face, 'preserve authored asymmetric wire landmarks');
    assert.ok(
      Math.hypot(face.centers[0][0] - face.centers[1][0], face.centers[0][1] - face.centers[1][1]) >
        2 * face.radius,
      'eyes overlap',
    );
    assertUnchanged(source, before, originalFace);
  });
  test(`${shape}/${detail}: rotated Tuft root seats on a real triangle without mutating donors`, () => {
    const before = snapshot(source),
      donorBefore = snapshot(donor);
    const originalFace = JSON.stringify(source.face),
      donorFace = JSON.stringify(donor.face);
    const profile = catalogLayout(shape).tuft;
    const fitted = fitCatalogPieces(source, donor, 'accessory', 'three_lobe', {
      tuftLayout: profile,
    });
    const unscaledProfile = fitCatalogPieces(source, donor, 'accessory', 'three_lobe', {
      tuftLayout: { ...profile, scale: 1 },
    });
    assert.ok(
      Math.abs(fitted[0].scale / unscaledProfile[0].scale - profile.scale) < 1e-14,
      'profile scale was not applied',
    );
    const originalFit = fitted.map(({ part, ...transform }) => structuredClone(transform));
    const seated = seatCatalogAccessories(source, donor, fitted, 'three_lobe', profile);
    assert.ok(seated.length > 0);
    for (let i = 0; i < seated.length; i++) {
      const placement = seated[i];
      assert.deepEqual(
        Object.fromEntries(Object.entries(fitted[i]).filter(([key]) => key !== 'part')),
        originalFit[i],
      );
      assert.equal(placement.rotationZ, profile.rotationZ);
      assert.ok(placement.scale > 0 && Number.isFinite(placement.scale));
      const sourceRoot = closestBodySurface(donor.body, placement.part.attachmentPivot);
      const initialRoot = new Vector3()
        .fromArray(sourceRoot)
        .applyMatrix4(catalogPieceMatrix(fitted[i]));
      const expectedRoot = closestBodySurface(source.body, [
        (source.body.bounds.min[0] + source.body.bounds.max[0]) / 2 +
          (source.body.bounds.max[0] - source.body.bounds.min[0]) * profile.x,
        source.body.bounds.max[1] +
          0.5 * (placement.part.bounds.max[1] - placement.part.bounds.min[1]) * placement.scale,
        initialRoot.z,
      ]);
      assert.ok(
        new Vector3()
          .fromArray(expectedRoot)
          .distanceTo(new Vector3().fromArray(placement.attachmentRoot)) < 1e-13,
        'profile must choose the crest using its own horizontal position',
      );
      const transformedRoot = new Vector3()
        .fromArray(sourceRoot)
        .applyMatrix4(catalogPieceMatrix(placement));
      assert.ok(
        transformedRoot.distanceTo(new Vector3().fromArray(placement.attachmentRoot)) < 1e-13,
        'root/matrix mismatch',
      );
      assert.ok(
        distanceToTriangles(source.body, placement.attachmentRoot) < 1e-12,
        'root is off the body',
      );
      const transformed = transformCatalogPiece(placement.part, placement);
      geometries.push(transformed.geometry);
      const positions = transformed.geometry.getAttribute('position');
      const extrema = {
        min: [Infinity, Infinity, Infinity],
        max: [-Infinity, -Infinity, -Infinity],
      };
      for (let v = 0; v < positions.count; v++)
        for (let k = 0; k < 3; k++) {
          const value = positions.array[v * 3 + k];
          extrema.min[k] = Math.min(extrema.min[k], value);
          extrema.max[k] = Math.max(extrema.max[k], value);
        }
      assert.deepEqual(transformed.bounds, extrema, 'bounds must follow rotated vertices');
    }
    assertUnchanged(source, before, originalFace);
    assertUnchanged(donor, donorBefore, donorFace);
  });
}
test('profiles produce distinct roots, scales and both rotation directions; capsule spreads eyes wider than circle', () => {
  for (const detail of ['low', 'high']) {
    const rows = cases.filter((row) => row.detail === detail);
    const placements = rows.map(({ shape, source, donor }) => {
      const tuftLayout = catalogLayout(shape).tuft;
      return seatCatalogAccessories(
        source,
        donor,
        fitCatalogPieces(source, donor, 'accessory', 'three_lobe', {
          tuftLayout,
        }),
        'three_lobe',
        tuftLayout,
      )[0];
    });
    assert.ok(placements.some((p) => p.rotationZ < 0) && placements.some((p) => p.rotationZ > 0));
    assert.ok(new Set(placements.map((p) => p.scale)).size > 5);
    assert.ok(
      new Set(placements.map((p) => p.attachmentRoot.map((v) => v.toFixed(5)).join(','))).size > 15,
    );
    const gap = (shape) => {
      const { source } = rows.find((row) => row.shape === shape);
      const face = fitCatalogFace(source, shape);
      return (
        Math.abs(face.centers[1][0] - face.centers[0][0]) /
        (source.body.bounds.max[0] - source.body.bounds.min[0])
      );
    };
    assert.ok(gap('capsule') > gap('circle'), 'capsule requires a wider normalized eye spacing');
  }
});
test('Todd keeps two eyes on its stalks but seats a single eye lower on the forehead', () => {
  for (const { source, shape } of cases.filter((row) => row.shape === 'rounded_head_two_ears')) {
    const pair = fitCatalogFace(source, shape);
    const single = fitCatalogFace(source, shape, true);
    const height = source.body.bounds.max[1] - source.body.bounds.min[1];
    assert(single.centers[0][1] < pair.centers[0][1] - height * 0.1);
    const middle = [0, 1].map((k) => (single.centers[0][k] + single.centers[1][k]) / 2);
    assert(
      Number.isFinite(bodyFront(source, ...middle)),
      'the single eye has body behind its center',
    );
    assert.equal(single.radius, pair.radius);
  }
});
