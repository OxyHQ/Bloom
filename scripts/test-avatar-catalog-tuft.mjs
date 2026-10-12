import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import {
  InstancedBufferGeometry,
  Float32BufferAttribute,
  Vector3,
  Matrix3,
} from 'three';
const temp = await mkdtemp('.local/catalog-tuft-test-');
for (const name of [
  'catalog-tuft',
  'tuft-surface',
  'catalog-fitting',
  'canonical-tuft',
  'motion',
])
  await writeFile(
    `${temp}/${name}.mjs`,
    ts
      .transpileModule(
        await readFile(`runtime/avatar/${name}.ts`, 'utf8'),
        {
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ES2022,
          },
        },
      )
      .outputText.replaceAll("'./catalog-fitting'", "'./catalog-fitting.mjs'")
      .replaceAll("'./catalog-tuft'", "'./catalog-tuft.mjs'")
      .replaceAll("'./tuft-surface'", "'./tuft-surface.mjs'"),
  );
const { integrateCatalogTuft } = await import(
  pathToFileURL(`${process.cwd()}/${temp}/catalog-tuft.mjs`)
);
const { prepareCanonicalTuft } = await import(
  pathToFileURL(`${process.cwd()}/${temp}/canonical-tuft.mjs`)
);
test.after(() => rm(temp, { recursive: true, force: true }));
const root = new Vector3(0, 1, 0),
  radius = 0.48,
  lift = 0.048,
  burial = 0.06,
  band = 0.168;
function map(p) {
  const t = Math.max(0, 1 - p.distanceToSquared(root) / (radius * radius));
  return p.clone().add(new Vector3(0, lift * t * t * t, 0));
}
function jacobian(p) {
  const h = 1e-5,
    cols = [];
  for (let k = 0; k < 3; k++) {
    let a = p.clone(),
      b = p.clone();
    a.setComponent(k, a.getComponent(k) + h);
    b.setComponent(k, b.getComponent(k) - h);
    cols.push(
      map(a)
        .sub(map(b))
        .multiplyScalar(1 / (2 * h)),
    );
  }
  return new Matrix3().set(
    cols[0].x,
    cols[1].x,
    cols[2].x,
    cols[0].y,
    cols[1].y,
    cols[2].y,
    cols[0].z,
    cols[1].z,
    cols[2].z,
  );
}
const v = (g, name, i = 0) =>
  new Vector3().fromBufferAttribute(g.getAttribute(name), i);
const fixture = () => {
  const part = (category, fur = false) => {
    const geometry = new InstancedBufferGeometry(),
      positions =
        category === 'body'
          ? [0.12, 0.94, 0, 1, -1, 0]
          : [-0.5, 1, 0, 0.5, 1.6, 0];
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    for (const name of ['normal', 'normal0', 'normal1'])
      geometry.setAttribute(
        name,
        new Float32BufferAttribute([0.3, 0.8, 0.2, 0.27, 0.92, 0.13], 3),
      );
    geometry.setAttribute(
      'delta0',
      new Float32BufferAttribute([0, 0.16, 0.05, 0, 0, 0], 3),
    );
    geometry.setAttribute(
      'delta1',
      new Float32BufferAttribute([0.3, 0.2, 0, 0, 0, 0], 3),
    );
    geometry.setAttribute(
      'paletteGeometry',
      new Float32BufferAttribute([7, 0.3, 0.8, 0.2, 9, 0.27, 0.92, 0.13], 4),
    );
    if (category === 'body' && !fur) {
      const attrs = Object.entries(geometry.attributes);
      for (const [name, a] of attrs) {
        const tail =
          name === 'position'
            ? [-1, 1, -1, 1, 1, -1, 0, 1, 1]
            : name.startsWith('normal')
              ? [0, 1, 0, 0, 1, 0, 0, 1, 0]
              : Array(a.itemSize * 3).fill(0);
        geometry.setAttribute(
          name,
          new Float32BufferAttribute([...a.array, ...tail], a.itemSize),
        );
      }
      geometry.setIndex([2, 3, 4]);
    }
    return {
      geometry,
      id: category === 'body' ? 0 : 1,
      fur,
      category,
      attachment: category === 'body' ? '' : 'three_lobe',
      attachmentPivot: root.toArray(),
      bounds:
        category === 'body'
          ? { min: [-1, -1, -1], max: [1, 1, 1] }
          : { min: [-0.5, 1, 0], max: [0.5, 1.6, 0] },
      fields: { paletteReference: [0, 0, 0, 0] },
    };
  };
  return {
    body: [part('body'), part('body', true)],
    tuft: [part('accessory'), part('accessory', true)],
  };
};
test('surface and both morph endpoints follow the same C2 map with their own inverse-transpose normals', () => {
  const { body, tuft } = fixture(),
    g = body[0].geometry,
    before = g.clone(),
    p = v(before, 'position'),
    targets = [
      p,
      p.clone().add(v(before, 'delta0')),
      p.clone().add(v(before, 'delta1')),
    ];
  integrateCatalogTuft(body, tuft);
  assert(v(g, 'position').distanceTo(map(p)) < 4e-8);
  for (let k = 0; k < 3; k++) {
    const name = ['normal', 'normal0', 'normal1'][k],
      expected = v(before, name)
        .applyMatrix3(jacobian(targets[k]).invert().transpose())
        .normalize();
    assert(v(g, name).distanceTo(expected) < 8e-8, `Endpoint ${k} normal`);
    if (k) {
      const delta = map(targets[k]).sub(map(p));
      assert(v(g, `delta${k - 1}`).distanceTo(delta) < 4e-8);
    }
  }
  assert.equal(g.getAttribute('paletteGeometry').getX(0), 7);
});
test('all attributes remain byte-identical outside support, including nonunit authored normals', () => {
  const { body, tuft } = fixture(),
    before = body.map((p) => p.geometry.clone());
  integrateCatalogTuft(body, tuft);
  for (let p = 0; p < body.length; p++)
    for (const [name, a] of Object.entries(body[p].geometry.attributes)) {
      const b = before[p].getAttribute(name);
      for (let k = 0; k < a.itemSize; k++)
        assert.equal(
          a.array[a.itemSize + k],
          b.array[b.itemSize + k],
          `${p}/${name}/${k}`,
        );
    }
});
test('fur roots match surface mapping; normals use inverse transpose, side and curvature use Jacobian', () => {
  const { body, tuft } = fixture(),
    g = body[1].geometry,
    before = g.clone(),
    p = v(before, 'position'),
    J = jacobian(p);
  integrateCatalogTuft(body, tuft);
  assert(v(g, 'position').distanceTo(v(body[0].geometry, 'position')) === 0);
  const n = v(before, 'normal')
    .applyMatrix3(J.clone().invert().transpose())
    .normalize();
  assert(v(g, 'normal').distanceTo(n) < 8e-8);
  const side = v(before, 'normal0').applyMatrix3(J),
    projected = side.addScaledVector(n, -side.dot(n)).normalize();
  assert(v(g, 'normal0').distanceTo(projected) < 8e-8);
  assert(v(g, 'delta1').distanceTo(v(before, 'delta1').applyMatrix3(J)) < 8e-8);
  assert(Math.abs(v(g, 'normal').dot(v(g, 'normal0'))) < 8e-8);
});
test('root-only insertion preserves emerging tips byte-for-byte, with coherent surface/fur/morph endpoints', () => {
  const { body, tuft } = fixture(),
    before = tuft.map((p) => p.geometry.clone());
  const mapRoot = (p) => {
    const u = Math.max(0, Math.min(1, (p.y - 1) / band)),
      w = 1 - u * u * u * (10 + u * (-15 + 6 * u));
    return p.clone().add(new Vector3(0, -burial * w, 0));
  };
  integrateCatalogTuft(body, tuft);
  for (let i = 0; i < 2; i++)
    for (let p = 0; p < 2; p++)
      assert(
        v(tuft[p].geometry, 'position', i).distanceTo(
          mapRoot(v(before[p], 'position', i)),
        ) < 8e-8,
      );
  for (let p = 0; p < 2; p++)
    for (const [name, a] of Object.entries(tuft[p].geometry.attributes)) {
      const b = before[p].getAttribute(name);
      for (let k = 0; k < a.itemSize; k++)
        assert.equal(
          a.array[a.itemSize + k],
          b.array[b.itemSize + k],
          `Emerging tip ${p}/${name}/${k}`,
        );
    }
  for (const name of ['delta0', 'delta1']) {
    const p = v(before[0], 'position'),
      expected = mapRoot(p.clone().add(v(before[0], name))).sub(mapRoot(p));
    assert(v(tuft[0].geometry, name).distanceTo(expected) < 8e-8);
  }
  assert.equal(
    tuft[0].bounds.max[1],
    before[0].getAttribute('position').getY(1),
  );
});
test('canonical preparation clones shared donor storage, excludes eyes and activity props, and is idempotent', () => {
  const { body, tuft } = fixture();
  body[0].geometry.setIndex([0, 1, 0]); // replace with a real support plane
  body[0].geometry.setAttribute(
    'position',
    new Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 0, 1, 1], 3),
  );
  body[0].geometry.setIndex([0, 1, 2]);
  for (const [name, a] of Object.entries(body[0].geometry.attributes))
    if (name !== 'position') {
      const values = Array.from(a.array);
      body[0].geometry.setAttribute(
        name,
        new Float32BufferAttribute(
          [...values, ...values.slice(0, a.itemSize)],
          a.itemSize,
        ),
      );
    }
  const eye = {
      ...tuft[0],
      id: 2,
      attachment: 'eye',
      geometry: tuft[0].geometry.clone(),
    },
    activity = {
      ...tuft[0],
      id: 3,
      activity: 'computer',
      geometry: tuft[0].geometry.clone(),
    },
    parts = [...body, ...tuft, eye, activity],
    originals = parts.map((p) => p.geometry),
    bytes = originals.map((g) =>
      Object.fromEntries(
        Object.entries(g.attributes).map(([k, a]) => [k, Array.from(a.array)]),
      ),
    );
  const anchors = prepareCanonicalTuft(parts);
  assert.equal(anchors.size, 1);
  assert.equal(parts[4].geometry, originals[4]);
  assert.equal(parts[5].geometry, originals[5]);
  for (let i = 0; i < 4; i++) assert.notEqual(parts[i].geometry, originals[i]);
  for (let i = 0; i < originals.length; i++)
    for (const [k, a] of Object.entries(originals[i].attributes))
      assert.deepEqual(Array.from(a.array), bytes[i][k]);
  const own = parts.map((p) => p.geometry);
  assert.equal(prepareCanonicalTuft(parts), anchors);
  for (let i = 0; i < parts.length; i++)
    assert.equal(parts[i].geometry, own[i]);
});

for (const detail of ['low', 'high'])
  test(`canonical blue_spectacles ${detail}: shared coordinate frame, finite surface/fur and immutable source bytes`, async () => {
    const base = 'runtime/avatar/assets/blue_spectacles',
      stem = detail === 'low' ? 'geometry-low' : 'geometry';
    const manifest = JSON.parse(await readFile(`${base}/${stem}.json`, 'utf8')),
      bytes = await readFile(`${base}/${stem}.bin`),
      before = Buffer.from(bytes),
      material = JSON.parse(await readFile(`${base}/material.json`, 'utf8'));
    const body = material.parts.find((p) => p.id === 0),
      tuft = material.parts.find((p) => p.attachment === 'three_lobe');
    assert.deepEqual(body.fields.world, tuft.fields.world);
    assert.deepEqual(body.fields.normalMatrix, tuft.fields.normalMatrix);
    const parts = [];
    for (const record of manifest.parts.filter(
      (p) => p.id === 0 || p.id === tuft.id,
    ))
      for (const fur of [false, true]) {
        const block = fur ? record.fur : record.vertices;
        if (!block) continue;
        const geometry = new InstancedBufferGeometry(),
          view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const rename = {
          positionDelta0: 'delta0',
          positionDelta1: 'delta1',
          normalTarget0: 'normal0',
          normalTarget1: 'normal1',
        };
        const attrs = fur
          ? {
              position: { byteOffset: 0, components: 3 },
              normal: { byteOffset: 12, components: 3 },
              normal0: { byteOffset: 24, components: 3 },
              delta1: { byteOffset: 36, components: 3 },
              paletteGeometry: { byteOffset: 48, components: 4 },
            }
          : block.attributes;
        for (const [name, attr] of Object.entries(attrs)) {
          const a = new Float32Array(block.count * attr.components);
          for (let i = 0; i < block.count; i++)
            for (let k = 0; k < attr.components; k++)
              a[i * attr.components + k] = view.getFloat32(
                block.byteOffset +
                  i * block.byteStride +
                  attr.byteOffset +
                  4 * k,
                true,
              );
          geometry.setAttribute(
            rename[name] ?? name,
            new Float32BufferAttribute(a, attr.components),
          );
        }
        if (!fur)
          geometry.setIndex(
            record.indices.flatMap((r) =>
              Array.from({ length: r.count }, (_, i) =>
                r.componentType === 'uint16'
                  ? view.getUint16(r.byteOffset + i * 2, true)
                  : view.getUint32(r.byteOffset + i * 4, true),
              ),
            ),
          );
        const description = material.parts.find((p) => p.id === record.id);
        parts.push({
          geometry,
          id: record.id,
          fur,
          fields: description.fields,
          attachment: description.attachment,
        });
      }
    const originals = parts.map((p) => p.geometry);
    const anchors = prepareCanonicalTuft(parts);
    assert(anchors.has(tuft.id));
    const tuftIndex = parts.findIndex((p) => p.id === tuft.id && !p.fur),
      oldTip = originals[tuftIndex].getAttribute('position');
    let highest = 0;
    for (let i = 1; i < oldTip.count; i++)
      if (oldTip.getY(i) > oldTip.getY(highest)) highest = i;
    assert.deepEqual(
      v(parts[tuftIndex].geometry, 'position', highest).toArray(),
      v(originals[tuftIndex], 'position', highest).toArray(),
      'Authored highest tip must retain its silhouette',
    );

    assert(bytes.equals(before));
    let changed = 0;
    for (let p = 0; p < parts.length; p++) {
      for (const a of Object.values(parts[p].geometry.attributes))
        assert(Array.from(a.array).every(Number.isFinite));
      const x = parts[p].geometry.getAttribute('position'),
        y = originals[p].getAttribute('position');
      for (let k = 0; k < x.array.length; k++)
        if (x.array[k] !== y.array[k]) changed++;
    }
    assert(changed > 100);
    // Motion files are independent semantic observations. Report whether geometry
    // integration alone also pins this native attachment during each action.
    const { AuthoredMotionSampler } = await import(
      pathToFileURL(`${process.cwd()}/${temp}/motion.mjs`)
    );
    const idleDoc = JSON.parse(
        await readFile(
          'runtime/avatar/assets/motion/blue_spectacles.json',
          'utf8',
        ),
      ),
      workDoc = JSON.parse(
        await readFile(`${base}/computer-motion.json`, 'utf8'),
      );
    const drift = {};
    for (const [kind, clip] of Object.entries({
      ...idleDoc.clips,
      work: workDoc.clip,
    })) {
      const sampler = new AuthoredMotionSampler(clip),
        pose = sampler.createPose();
      let maximum = 0,
        at = 0;
      for (const t of clip.times) {
        sampler.sample(t, pose);
        const b = pose.find((p) => p.id === 'mesh:0'),
          a = pose.find((p) => p.id === `mesh:${tuft.id}`);
        if (!a) throw Error('Missing canonical tuft motion');
        const e = new Vector3()
          .fromArray(anchors.get(tuft.id))
          .applyMatrix4(a.world)
          .distanceTo(
            new Vector3().fromArray(anchors.get(tuft.id)).applyMatrix4(b.world),
          );
        if (e > maximum) {
          maximum = e;
          at = t;
        }
      }
      assert.equal(
        maximum,
        0,
        `Canonical ${detail}/${kind} attachment separates from body`,
      );
      drift[kind] = { maximum, at };
    }
    await writeFile(
      `.local/canonical-tuft-${detail}.json`,
      JSON.stringify({ root: anchors.get(tuft.id), changed, drift }, null, 2),
    );
  });

test('surface query follows actual concave/wire triangles and their normals, not the body-center radius', async () => {
  const { tuftSurface } = await import(
    pathToFileURL(`${process.cwd()}/${temp}/tuft-surface.mjs`)
  );
  const g = new InstancedBufferGeometry();
  g.setAttribute(
    'position',
    new Float32BufferAttribute(
      [
        0.1, -1, -1, 0.1, 1, -1, 0.1, 0, 1, -0.1, -1, -1, -0.1, 1, -1, -0.1, 0,
        1,
      ],
      3,
    ),
  );
  g.setAttribute(
    'normal',
    new Float32BufferAttribute(
      [-1, 0, 0, -1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
      3,
    ),
  );
  g.setIndex([0, 1, 2, 3, 4, 5]);
  const a = tuftSurface(g, [0.09, 0, 0]),
    b = tuftSurface(g, [-0.09, 0, 0]);
  assert(Math.abs(a.point[0] - 0.1) < 1e-8);
  assert(Math.abs(b.point[0] + 0.1) < 1e-8);
  assert.deepEqual(a.normal, [-1, 0, 0]);
  assert.deepEqual(b.normal, [1, 0, 0]);
});
test('root insertion band uses its own Jacobian for normals, morph targets and fur curvature', () => {
  const { body, tuft } = fixture();
  for (const p of tuft)
    p.geometry.getAttribute('position').setXYZ(0, 0.1, 1.08, 0.02);
  const before = tuft.map((p) => p.geometry.clone());
  integrateCatalogTuft(body, tuft);
  const derivative = (p) => {
    const u = (p.y - 1) / band;
    return u > 0 && u < 1
      ? (burial * 30 * u * u * (1 - u) * (1 - u)) / band
      : 0;
  };
  for (const [name, delta] of [
    ['normal', null],
    ['normal0', 'delta0'],
    ['normal1', 'delta1'],
  ]) {
    const at = v(before[0], 'position');
    if (delta) at.add(v(before[0], delta));
    const gain = derivative(at),
      expected = v(before[0], name);
    if (gain) expected.setY(expected.y / (1 + gain)).normalize();
    assert(v(tuft[0].geometry, name).distanceTo(expected) < 8e-8, name);
  }
  const gain = derivative(v(before[1], 'position')),
    bend = v(before[1], 'delta1');
  bend.setY(bend.y * (1 + gain));
  assert(v(tuft[1].geometry, 'delta1').distanceTo(bend) < 8e-8);
});
