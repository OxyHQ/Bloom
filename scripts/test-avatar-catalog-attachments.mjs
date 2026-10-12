import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { Matrix4, Quaternion, Euler, Vector3 } from 'three';
import ts from 'typescript';
const temp = await mkdtemp('.local/catalog-attachment-test-');
for (const name of ['motion', 'catalog-retarget'])
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
      .outputText.replace("'./motion'", "'./motion.mjs'"),
  );
const { AuthoredMotionSampler } = await import(
  pathToFileURL(`${process.cwd()}/${temp}/motion.mjs`)
);
const { CatalogRetargetSampler } = await import(
  pathToFileURL(`${process.cwd()}/${temp}/catalog-retarget.mjs`)
);
test.after(() => rm(temp, { recursive: true, force: true }));
const part = (id, move) => ({
  id,
  translation: {
    samples: [
      0,
      0,
      0,
      move,
      move * 0.3,
      move * -0.7,
      move * 0.2,
      move * 0.5,
      move,
    ],
  },
  rotation: {
    samples: [
      0,
      0,
      0,
      1,
      ...new Quaternion().setFromEuler(new Euler(0.21, 0.42, -0.17)).toArray(),
      ...new Quaternion().setFromEuler(new Euler(-0.18, -0.25, 0.15)).toArray(),
    ],
  },
  scale: { samples: [1, 1, 1, 1.2, 0.8, 1.1, 0.9, 1.3, 0.85] },
  fields: {
    catalogCenterWeight: { samples: [0, 0, 0, 0, 1, 0, 0, 0, 0.4, 0, 0, 0] },
  },
});
const clip = {
  duration: 2,
  loop: false,
  times: [0, 1, 2],
  parts: [part('mesh:0', 0.4), part('mesh:1', 2)],
};
for (const kind of ['idle', 'reaction', 'work'])
  test(`${kind}: accessory anchor follows body while preserving animated linear/normal and private outputs`, () => {
    const observed = new AuthoredMotionSampler({
        ...clip,
        loop: kind === 'idle',
      }),
      bodyBinding = {
        sourceId: 'mesh:0',
        targetId: 'mesh:0',
        category: 'body',
        sourcePivot: [0, 0, 0],
        targetPivot: [0, 0, 0],
        geometryTransform: new Matrix4(),
        fields: { catalogCenterWeight: [0, 0, 0, 0] },
      };
    const binding = {
        ...bodyBinding,
        sourceId: 'mesh:1',
        targetId: 'mesh:1',
        category: 'accessory',
        sourceSceneCenter: [0.2, -0.4],
        sceneCenterDelta: [0.5, 0.3],
        geometryTransform: new Matrix4()
          .makeScale(1.3, 1.3, 1.3)
          .setPosition(0.2, 0.7, -0.1),
      },
      anchor = [0.17, 0.83, -0.23],
      dims = { ground: -1, height: 2 };
    const base =
      kind === 'work'
        ? new AuthoredMotionSampler({ ...clip, parts: [part('mesh:0', 3)] })
        : undefined;
    const fixed = new CatalogRetargetSampler(
        observed,
        [bodyBinding, { ...binding, attachmentAnchor: anchor }],
        dims,
        dims,
        base,
      ),
      free = new CatalogRetargetSampler(
        observed,
        [bodyBinding, binding],
        dims,
        dims,
        base,
      ),
      pose = fixed.createPose(),
      freePose = free.createPose(),
      neighbor = fixed.createPose(),
      neighborBefore = JSON.stringify(neighbor),
      refs = pose.map((p) => [
        p.world,
        p.normalMatrix,
        ...Object.values(p.fields),
      ]);
    let freeDetach = 0;
    for (let step = 0; step <= 120; step++) {
      const time = step / 60;
      fixed.sample(time, pose);
      free.sample(time, freePose);
      const body = pose[0],
        accessory = pose[1],
        native = freePose[1],
        expected = new Vector3().fromArray(anchor).applyMatrix4(body.world),
        actual = new Vector3().fromArray(anchor).applyMatrix4(accessory.world);
      assert(actual.distanceTo(expected) < 2e-15);
      for (const k of [0, 1, 2, 4, 5, 6, 8, 9, 10])
        assert.equal(accessory.world.elements[k], native.world.elements[k]);
      assert.deepEqual(
        accessory.normalMatrix.elements,
        native.normalMatrix.elements,
      );
      freeDetach = Math.max(
        freeDetach,
        new Vector3()
          .fromArray(anchor)
          .applyMatrix4(native.world)
          .distanceTo(expected),
      );
      for (let p = 0; p < pose.length; p++) {
        assert.equal(pose[p].world, refs[p][0]);
        assert.equal(pose[p].normalMatrix, refs[p][1]);
        assert.equal(pose[p].fields.catalogCenterWeight, refs[p][2]);
      }
    }
    assert(
      freeDetach > 0.5,
      'Discriminator must detect the prior separated accessory',
    );
    assert.equal(JSON.stringify(neighbor), neighborBefore);
  });

test('rotated accessory animation conjugates normals with geometry and retains the fixed root', () => {
  const accessory = part('mesh:1', 2);
  accessory.rotation = {
    samples: [
      0,
      0,
      0,
      1,
      ...new Quaternion().setFromEuler(new Euler(-0.37, 0.19, 0.61)).toArray(),
      ...new Quaternion().setFromEuler(new Euler(0.29, -0.51, -0.33)).toArray(),
    ],
  };
  const source = new AuthoredMotionSampler({
      ...clip,
      parts: [clip.parts[0], accessory],
    }),
    anchor = [0.2, 0.7, -0.1],
    dims = { ground: -1, height: 2 },
    fields = { catalogCenterWeight: [0, 0, 0, 0] };
  const common = { sourcePivot: [0, 0, 0], targetPivot: [0, 0, 0], fields };
  const F = new Matrix4()
    .makeRotationZ(0.43)
    .scale(new Vector3(1.4, 1.4, 1.4))
    .setPosition(0.2, 0.4, 0.1);
  const sampler = new CatalogRetargetSampler(
      source,
      [
        {
          ...common,
          sourceId: 'mesh:0',
          targetId: 'mesh:0',
          category: 'body',
          geometryTransform: new Matrix4(),
        },
        {
          ...common,
          sourceId: 'mesh:1',
          targetId: 'mesh:1',
          category: 'accessory',
          geometryTransform: F,
          attachmentAnchor: anchor,
        },
      ],
      dims,
      dims,
    ),
    pose = sampler.createPose();
  let moved = 0;
  for (let i = 0; i <= 120; i++) {
    sampler.sample(i / 60, pose);
    const expected = pose[1].world
      .clone()
      .setPosition(0, 0, 0)
      .invert()
      .transpose();
    for (const k of [0, 1, 2, 4, 5, 6, 8, 9, 10])
      assert(
        Math.abs(expected.elements[k] - pose[1].normalMatrix.elements[k]) <
          2e-14,
      );
    const root = new Vector3().fromArray(anchor);
    assert(
      root
        .clone()
        .applyMatrix4(pose[0].world)
        .distanceTo(root.applyMatrix4(pose[1].world)) < 2e-15,
    );
    moved = Math.max(moved, Math.abs(pose[1].normalMatrix.elements[4]));
  }
  assert(moved > 0.1);
});

for (const kind of ['idle', 'reaction', 'work'])
  test(`${kind}: body-tissue RGB follows live coat despite zero-red donor and preserves roughness/other accessories`, () => {
    const observation = structuredClone(clip);
    observation.parts.push(part('mesh:2', 0));
    observation.parts[0].fields.colorRoughness = { value: [0, 0.44, 1, 0.78] };
    observation.parts[1].fields.colorRoughness = {
      samples: [0, 0.44, 1, 0.7, 0, 0.5, 1, 0.8, 0, 0.6, 1, 0.9],
    };
    observation.parts[2].fields.colorRoughness = {
      value: [0.8, 0.2, 0.3, 0.4],
    };
    const bindings = observation.parts.map((part, i) => ({
      sourceId: part.id,
      targetId: part.id,
      category: i ? 'accessory' : 'body',
      inheritBodyPigment: i === 1,
      sourcePivot: [0, 0, 0],
      targetPivot: [0, 0, 0],
      geometryTransform: new Matrix4(),
      fields: {
        colorRoughness:
          i === 0
            ? [0.063, 0.188, 1, 0.78]
            : i === 1
              ? [0, 0.44, 1, 0.7]
              : [0.8, 0.2, 0.3, 0.4],
      },
    }));
    const activity = structuredClone(observation);
    activity.parts = [activity.parts[0]];
    activity.parts[0].fields.colorRoughness = {
      samples: [
        0.46, 0.68, 0.003, 0.78, 0.5, 0.7, 0.1, 0.78, 0.4, 0.6, 0.2, 0.78,
      ],
    };
    const sourceBefore = JSON.stringify(observation),
      bindingsBefore = JSON.stringify(bindings);
    const dims = { ground: -1, height: 2 };
    const sampler = new CatalogRetargetSampler(
      new AuthoredMotionSampler(observation),
      bindings,
      dims,
      dims,
      kind === 'work' ? new AuthoredMotionSampler(activity) : undefined,
    );
    const pose = sampler.createPose(),
      neighbor = sampler.createPose(),
      untouched = JSON.stringify(neighbor);
    const arrays = pose.map((part) => part.fields.colorRoughness);
    for (const time of [0, 0.25, 0.5, 1, 1.5, 2]) {
      sampler.sample(time, pose);
      const [body, tuft, accessory] = pose.map(
        (part) => part.fields.colorRoughness,
      );
      assert.ok(body[0] > 0, 'destination coat has red absent from donor');
      assert.deepEqual(tuft.slice(0, 3), body.slice(0, 3));
      assert.ok(
        Math.abs(tuft[3] - (0.7 + time * 0.1)) < 1e-14,
        'retain Tuft animated roughness',
      );
      assert.deepEqual(
        accessory,
        [0.8, 0.2, 0.3, 0.4],
        'other accessories retain their pigment',
      );
      assert.equal(JSON.stringify(neighbor), untouched);
      pose.forEach((part, i) =>
        assert.strictEqual(part.fields.colorRoughness, arrays[i]),
      );
    }
    assert.equal(JSON.stringify(observation), sourceBefore);
    assert.equal(JSON.stringify(bindings), bindingsBefore);
  });
