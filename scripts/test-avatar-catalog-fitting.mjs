/** Compare the semantic composer against the existing geometry fitting contract. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';
import { avatarFixture, fixtureAssembly } from './avatar-test-fixtures.mjs';
const fixture = await avatarFixture('fitting');
const temp = await mkdtemp('.local/catalog-fit-test-');
await writeFile(
  `${temp}/fitting.mjs`,
  ts.transpileModule(await readFile('runtime/avatar/catalog-fitting.ts', 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText,
);
const {
  fitCatalogPieces,
  bodyFront,
  transformCatalogPiece,
  closestBodySurface,
  seatCatalogAccessories,
} = await import(pathToFileURL(`${process.cwd()}/${temp}/fitting.mjs`));
test.after(() => rm(temp, { recursive: true, force: true }));
const data = fixture.sources.map((source) => ({
  preset: source.preset,
  semantic: fixtureAssembly(source),
}));
for (const target of data)
  test(`${target.preset}: all donor placements retain the existing geometry fitting`, () => {
    for (const donor of data)
      for (const category of ['eyes', 'eyewear', 'accessory']) {
        const ids =
          category === 'eyes'
            ? ['eyes']
            : [
                ...new Set(
                  donor.semantic.pieces
                    .filter((p) => p.category === category)
                    .map((p) => p.selection),
                ),
              ].filter(Boolean);
        for (const id of ids) {
          const expected =
            fixture.placements[[target.preset, donor.preset, category, id].join('/')];
          if (expected === null) {
            assert.throws(() => fitCatalogPieces(target.semantic, donor.semantic, category, id));
            continue;
          }
          let actual;
          actual = fitCatalogPieces(target.semantic, donor.semantic, category, id);
          assert.deepEqual(
            actual.map(({ part, ...t }) => ({ id: part.id, ...t })),
            expected,
            `${donor.preset}/${category}/${id}`,
          );
        }
      }
  });
test('fitted geometry is independent and keeps normals/morph targets and anchors', () => {
  const source = data[3].semantic.pieces[1];
  source.geometry.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1], 3));
  source.geometry.setAttribute('delta0', new THREE.Float32BufferAttribute([0.25, 0.5, 0.75], 3));
  source.pivot = [1, 2, 3];
  source.attachmentPivot = [2, 3, 4];
  const before = source.geometry.getAttribute('position').array.slice();
  const fitted = transformCatalogPiece(source, {
    scale: 2,
    origin: [1, 1, 1],
    translate: [3, 4, 5],
  });
  assert.deepEqual(source.geometry.getAttribute('position').array, before);
  assert.deepEqual([...fitted.geometry.getAttribute('normal').array], [0, 0, 1]);
  assert.deepEqual([...fitted.geometry.getAttribute('delta0').array], [0.5, 1, 1.5]);
  assert.deepEqual(fitted.pivot, [4, 7, 10]);
  assert.deepEqual(fitted.attachmentPivot, [6, 9, 12]);
  assert.throws(() =>
    transformCatalogPiece(source, {
      scale: 0,
      origin: [0, 0, 0],
      translate: [0, 0, 0],
    }),
  );
});
test('a crown follows the real body surface, regardless of eye height', () => {
  const body = (geometry) => {
    geometry.computeBoundingBox();
    return {
      geometry,
      bounds: {
        min: geometry.boundingBox.min.toArray(),
        max: geometry.boundingBox.max.toArray(),
      },
    };
  };
  const source = body(new THREE.BoxGeometry(2, 2, 2)),
    target = body(new THREE.BoxGeometry(2, 1, 2));
  const part = {
    ...body(new THREE.BoxGeometry(1, 0.4, 1).translate(0, 1.2, 0)),
    attachmentPivot: [0, 1, 0],
    pivot: [0, 1, 0],
  };
  const placements = [{ part, scale: 1, origin: [0, 0, 0], translate: [0, 0, 0] }];
  const seated = seatCatalogAccessories(
    {
      body: target,
      pieces: [{ category: 'eyes', bounds: { min: [-1, 1, -1], max: [1, 5, 1] } }],
    },
    { body: source },
    placements,
    'crown',
  );
  assert.equal(seated[0].attachmentRoot[1], 0.5);
  assert(Math.abs(seated[0].translate[1] + 0.504) < 1e-6);
  assert.equal(seated[0].translate[0], 0);
  assert.equal(seated[0].translate[2], 0);
  assert.deepEqual(placements[0].translate, [0, 0, 0]);
});
test('surface attachment respects open silhouettes instead of their empty bounding box', () => {
  const geometry = new THREE.TorusGeometry(1, 0.1, 12, 48);
  geometry.computeBoundingBox();
  const body = {
    geometry,
    bounds: {
      min: geometry.boundingBox.min.toArray(),
      max: geometry.boundingBox.max.toArray(),
    },
  };
  const point = closestBodySurface(body, [0, 0, 0]);
  const radius = Math.hypot(point[0], point[1]);
  assert(radius > 0.89 && radius < 0.91, 'root lands on the wire, not at the center of the hole');
  assert(Math.abs(point[2]) < 1e-6);
});

test('Tuft seats on a real upper crest, preserves donor-side preference and leaves placements immutable', () => {
  const make = (positions, indices) => {
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeBoundingBox();
    return {
      geometry,
      bounds: {
        min: geometry.boundingBox.min.toArray(),
        max: geometry.boundingBox.max.toArray(),
      },
      category: 'body',
      id: 0,
    };
  };
  // Two disconnected wire crests, with an empty middle. An old nearest-side
  // query would choose the low left stem; the upper query must choose its tip.
  const targetBody = make(
    [-0.6, 0.1, -0.1, -0.6, 0.1, 0.1, -0.6, 1, 0, 0.6, 0.1, -0.1, 0.6, 0.1, 0.1, 0.6, 0.8, 0],
    [0, 1, 2, 3, 4, 5],
  );
  const donorBody = make([-1, 0, -1, 1, 0, -1, 0, 0, 1], [0, 1, 2]);
  const accessory = {
    ...donorBody,
    id: 1,
    category: 'accessory',
    attachmentPivot: [-0.6, 0, 0],
    pivot: [-0.6, 0, 0],
    bounds: { min: [-0.9, 0, -0.2], max: [-0.3, 0.6, 0.2] },
  };
  const placement = {
      part: accessory,
      scale: 1,
      origin: [0, 0, 0],
      translate: [0, 0, 0],
    },
    placements = [placement],
    saved = {
      scale: placement.scale,
      origin: [...placement.origin],
      translate: [...placement.translate],
    },
    bytes = Buffer.from(targetBody.geometry.getAttribute('position').array.buffer).slice();
  const target = {
      body: targetBody,
      pieces: [targetBody],
      face: { centers: [], radius: 0 },
    },
    donor = {
      body: donorBody,
      pieces: [donorBody, accessory],
      face: { centers: [], radius: 0 },
    };
  const seated = seatCatalogAccessories(target, donor, placements, 'three_lobe');
  assert(Math.abs(seated[0].attachmentRoot[0] + 0.6) < 3e-8);
  assert.equal(seated[0].attachmentRoot[1], 1);
  assert.equal(seated[0].attachmentRoot[2], 0);
  const surface = closestBodySurface(targetBody, seated[0].attachmentRoot);
  assert(
    new THREE.Vector3()
      .fromArray(surface)
      .distanceTo(new THREE.Vector3().fromArray(seated[0].attachmentRoot)) < 1e-15,
  );
  assert(
    closestBodySurface(targetBody, accessory.attachmentPivot)[1] < 0.2,
    'Discriminator: former side anchor sinks low',
  );
  assert.notEqual(seated, placements);
  assert.notEqual(seated[0], placement);
  assert.equal(seated[0].part, accessory);
  assert.deepEqual(
    {
      scale: placement.scale,
      origin: placement.origin,
      translate: placement.translate,
    },
    saved,
  );
  assert.equal(placement.attachmentRoot, undefined);
  assert(bytes.equals(Buffer.from(targetBody.geometry.getAttribute('position').array.buffer)));
});

test('a soft beret retains its authored insertion rather than floating above the head', () => {
  const piece = geometry => {
    geometry.computeBoundingBox();
    return {geometry,bounds:{min:geometry.boundingBox.min.toArray(),max:geometry.boundingBox.max.toArray()}};
  };
  const body=piece(new THREE.BoxGeometry(2,2,2));
  // Band bottom is 0.7: the original overlaps the head (top 1) by 0.3.
  const hat={...piece(new THREE.BoxGeometry(1.5,.4,1.5).translate(0,.9,0)),attachmentPivot:[0,1,0],pivot:[0,1,0]};
  const assembly={body,pieces:[body,hat]};
  const fitted=seatCatalogAccessories(assembly,assembly,[{part:hat,scale:1,origin:[0,0,0],translate:[0,0,0]}],'felipe_beret');
  assert(Math.abs(fitted[0].translate[1])<.01,'Do not raise the authored band by its 0.3 insertion');
  assert.deepEqual(fitted[0].attachmentRoot,[fitted[0].attachmentRoot[0],1,fitted[0].attachmentRoot[2]]);
});
