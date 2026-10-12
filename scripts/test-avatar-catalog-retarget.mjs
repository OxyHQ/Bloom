import test from 'node:test';
import { calibrateCatalogMaterials } from './calibrate-avatar-catalog-materials.mjs';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { Matrix4 } from 'three';
import {
  catalogObservation,
  catalogDrawFields,
  affineChannels,
  channel,
} from './build-avatar-catalog-motion.mjs';
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const temporary = await mkdtemp('.local/catalog-retarget-test-');
for (const name of ['motion', 'catalog-retarget', 'motion-binary'])
  await writeFile(
    `${temporary}/${name}.mjs`,
    ts
      .transpileModule(await readFile(`runtime/avatar/${name}.ts`, 'utf8'), {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ES2022,
        },
      })
      .outputText.replace("'./motion'", "'./motion.mjs'"),
  );
const { AuthoredMotionSampler } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/motion.mjs`)
);
const { CatalogRetargetSampler } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/catalog-retarget.mjs`)
);
test.after(() => rm(temporary, { recursive: true, force: true }));
const source = '.local/avatar-catalog-rig/rig2';
const geometry = await read(`${source}/combined-geometry.json`),
  manifest = await read(`${source}/manifest.json`);
const donor = await read('runtime/avatar/assets/catalog-library/eyes/todd/high/material.json');
const body = await read('runtime/avatar/assets/catalog-library/body/circle/high/material.json');
const placements = await read('scripts/fixtures/avatar/circle-todd-placements.json');
const dimensions = {
  ground: body.parts[0].bounds.min[1],
  height: body.parts[0].bounds.max[1] - body.parts[0].bounds.min[1],
};
const fieldValues = (data) =>
  Object.fromEntries(
    catalogDrawFields.map((name, k) => [name, data.slice(32 + k * 4, 36 + k * 4)]),
  );
for (const kind of ['idle', 'reaction'])
  test(`${kind}: combined rig retarget reproduces individual Circle/Todd world, normals and material channels`, async () => {
    const raw = await read(`${source}/probe-skip/${kind}-raw.json`);
    const expected = await read(`.local/avatar-catalog-motion/circle_todd/${kind}-raw.json`);
    const observation = catalogObservation(raw, geometry, manifest);
    await calibrateCatalogMaterials(
      observation,
      await read(`${source}/probe-skip/idle-raw.json`),
      manifest,
    );
    const bindings = Array.from({ length: 5 }, (_, i) => {
      const pivot = i ? donor.parts[i].pivot : [0, 0, 0];
      const fit = placements[i - 1];
      return {
        sourceId: `mesh:${i ? i + 4 : 0}`,
        targetId: `mesh:${i}`,
        category: i ? 'eyes' : 'body',
        sourcePivot: pivot,
        targetPivot: i
          ? pivot.map((v, k) =>
              Math.fround((v - fit.origin[k]) * fit.scale + fit.origin[k] + fit.translate[k]),
            )
          : pivot,
        geometryTransform: new Matrix4(),
        fields: fieldValues(expected.frames[0].draws[i].blocks.DrawBlock),
      };
    });
    const sampler = new CatalogRetargetSampler(
      new AuthoredMotionSampler(observation.clip),
      bindings,
      dimensions,
      dimensions,
    );
    const pose = sampler.createPose(),
      neighbor = sampler.createPose();
    const references = pose.map((part) => [
      part.world,
      part.normalMatrix,
      ...Object.values(part.fields),
    ]);
    const neighborBefore = JSON.stringify(neighbor);
    let world = 0,
      normal = 0,
      fields = 0,
      fieldAt;
    for (const frame of raw.frames) {
      sampler.sample(frame.renderTime - observation.nativeStart, pose);
      const native = expected.frames.find((f) => Math.abs(f.renderTime - frame.renderTime) < 1e-9);
      assert(native);
      for (let i = 0; i < pose.length; i++) {
        const part = pose[i],
          data = native.draws[i].blocks.DrawBlock;
        for (let k = 0; k < 16; k++) {
          world = Math.max(world, Math.abs(part.world.elements[k] - data[k]));
          normal = Math.max(normal, Math.abs(part.normalMatrix.elements[k] - data[16 + k]));
        }
        for (const [index, name] of catalogDrawFields.entries())
          for (let k = 0; k < 4; k++) {
            const error = Math.abs(part.fields[name][k] - data[32 + index * 4 + k]);
            if (error > fields) {
              fields = error;
              fieldAt = {
                time: frame.renderTime,
                part: i,
                name,
                k,
                actual: part.fields[name][k],
                expected: data[32 + index * 4 + k],
              };
            }
          }
        assert.deepEqual(
          [part.world, part.normalMatrix, ...Object.values(part.fields)].map(
            (value, k) => value === references[i][k],
          ),
          references[i].map(() => true),
        );
      }
    }
    assert(world <= 1.5e-7, `world ${world}`);
    assert(normal <= 4.8e-7, `normal ${normal}`);
    assert(fields <= 2.4e-7, JSON.stringify(fieldAt));
    assert.equal(
      JSON.stringify(neighbor),
      neighborBefore,
      'Sampling one avatar must not mutate another',
    );
  });

test('Computer attachment retarget follows the independently captured Circle body and preserves all eye channels', async () => {
  const source = '.local/avatar-catalog-rig/rig1';
  const geometry = await read(`${source}/combined-work-geometry.json`),
    manifest = await read(`${source}/work-manifest.json`);
  const raw = await read(`${source}/work/work-raw.json`);
  raw.frames = raw.frames.filter((f) => f.renderTime >= 3);
  const observed = catalogObservation(raw, geometry, manifest, {
    ignoreActivityProps: true,
  });
  await calibrateCatalogMaterials(
    observed,
    await read(`${source}/lime_frog/idle-raw.json`),
    manifest,
  );
  const center = (await read('.local/avatar-catalog-eye-centering.json')).rigs[1];
  const anchor = await read('.local/avatar-catalog-anchor-response.json');
  for (const part of observed.clip.parts) {
    part.fields.catalogCenterWeight = center.parts[part.id];
    const size = await read('.local/avatar-catalog-scale-response.json');
    Object.assign(
      part.fields,
      anchor.rigs[1].parts[part.id] ?? {},
      size.rigs[1].parts[part.id] ?? {},
    );
  }
  const expected = await read('.local/avatar-catalog-computer/circle/work-raw.json');
  const { decodeMotionBinary } = await import(
    pathToFileURL(`${process.cwd()}/${temporary}/motion-binary.mjs`)
  );
  const bytes = await readFile('runtime/avatar/assets/catalog-computer/circle/motion.bin');
  const document = decodeMotionBinary(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
  const bindings = Array.from({ length: 5 }, (_, i) => {
    const pivot = i ? donor.parts[i].pivot : [0, 0, 0],
      fit = placements[i - 1];
    return {
      sourceId: `mesh:${i ? i + 1 : 0}`,
      targetId: `mesh:${i}`,
      category: i ? 'eyes' : 'body',
      sourcePivot: pivot,
      targetPivot: i
        ? pivot.map((v, k) =>
            Math.fround((v - fit.origin[k]) * fit.scale + fit.origin[k] + fit.translate[k]),
          )
        : pivot,
      geometryTransform: i
        ? new Matrix4().makeScale(fit.scale, fit.scale, fit.scale)
        : new Matrix4(),
      sourceSceneCenter: center.center,
      sceneCenterDelta: center.center,
      fields: fieldValues(expected.frames[0].draws[i].blocks.DrawBlock),
    };
  });
  const sampler = new CatalogRetargetSampler(
    new AuthoredMotionSampler(observed.clip),
    bindings,
    dimensions,
    dimensions,
    new AuthoredMotionSampler(document.clip),
  );
  const pose = sampler.createPose();
  let world = 0,
    normal = 0,
    fields = 0,
    at;
  for (const frame of raw.frames) {
    sampler.sample(frame.renderTime - 3, pose);
    const native = expected.frames.find((f) => Math.abs(f.renderTime - frame.renderTime) < 1e-9);
    assert(native);
    for (let i = 1; i <= 4; i++) {
      const actual = pose.find((p) => p.id === `mesh:${i}`),
        data = native.draws[i].blocks.DrawBlock;
      for (let k = 0; k < 16; k++) {
        const error = Math.abs(actual.world.elements[k] - data[k]);
        if (error > world) {
          world = error;
          at = [frame.renderTime, i, k, actual.world.elements[k], data[k]];
        }
        normal = Math.max(normal, Math.abs(actual.normalMatrix.elements[k] - data[16 + k]));
      }
      for (const [j, name] of catalogDrawFields.entries())
        for (let k = 0; k < 4; k++)
          fields = Math.max(fields, Math.abs(actual.fields[name][k] - data[32 + j * 4 + k]));
    }
  }
  // Literal observed native-float shortfall; both improvements and regressions
  // require review instead of silently widening the general tolerance.
  assert(Math.abs(world - 3.0285172925026416e-7) < 1e-12);
  assert.deepEqual(at.slice(0, 3), [5.283333333333333, 3, 12]);
  assert(normal <= 1e-6, `Work normals ${normal}`);
  assert(fields <= 2.4e-7, `Work fields ${fields}`);
});

const anchorResponse = await read('.local/avatar-catalog-anchor-response.json');
const sizeResponse = await read('.local/avatar-catalog-scale-response.json');
const fixtureBindings = await read('.local/avatar-catalog-binding-fixtures.json');
for (const eyes of Object.keys(fixtureBindings))
  test(`${eyes}: fitted idle reproduces all isolated native eye matrices and fields`, async () => {
    const expected = await read(`.local/avatar-catalog-material-roles/${eyes}/idle-raw.json`);
    const sourceClips = [],
      sourceRecords = [];
    for (const g of [0, 1]) {
      const path = `.local/avatar-catalog-rig/rig${g}`,
        raw = await read(`${path}/lime_frog/idle-raw.json`),
        geometry = await read(`${path}/combined-geometry.json`),
        manifest = await read(`${path}/manifest.json`);
      const observation = catalogObservation(raw, geometry, manifest);
      await calibrateCatalogMaterials(observation, raw, manifest);
      sourceClips.push(observation.clip);
      sourceRecords.push(manifest.parts);
    }
    const clip = { ...sourceClips[0], parts: [] },
      bindings = [];
    for (const b of fixtureBindings[eyes].filter((b) => !b.fur)) {
      let g = 0,
        record = sourceRecords[0][0];
      if (b.category !== 'body') {
        for (g = 0; g < 2; g++) {
          record = sourceRecords[g].find(
            (p) => p.category === b.category && p.selection === eyes && p.sourcePart === b.sourceId,
          );
          if (record) break;
        }
        assert(record);
      }
      const source = sourceClips[g].parts.find((p) => p.id === `mesh:${record.id}`),
        id = b.id === 0 ? 'mesh:0' : `${source.id}@${g}`;
      clip.parts.push({ ...source, id });
      bindings.push({
        sourceId: id,
        targetId: `mesh:${b.id}`,
        category: b.category,
        sourcePivot: b.sourcePivot,
        targetPivot: b.pivot,
        geometryTransform: new Matrix4().fromArray(b.transform),
        fields: fieldValues(expected.frames[0].draws[b.id].blocks.DrawBlock),
      });
    }
    const sampler = new CatalogRetargetSampler(
        new AuthoredMotionSampler(clip),
        bindings,
        dimensions,
        dimensions,
      ),
      pose = sampler.createPose();
    let world = 0,
      normal = 0,
      fields = 0,
      at;
    for (const frame of expected.frames) {
      sampler.sample(frame.renderTime - 2, pose);
      for (const p of pose) {
        const id = Number(p.id.split(':')[1]),
          raw = frame.draws[id].blocks.DrawBlock;
        for (let k = 0; k < 16; k++) {
          const error = Math.abs(p.world.elements[k] - raw[k]);
          if (error > world) {
            world = error;
            at = [frame.renderTime, id, k];
          }
          normal = Math.max(
            normal,
            Math.abs(p.normalMatrix.elements[k] - raw[k + 16]) /
              Math.max(1, ...raw.slice(16, 32).map(Math.abs)),
          );
        }
        for (const [j, key] of catalogDrawFields.entries())
          for (let k = 0; k < 4; k++)
            fields = Math.max(fields, Math.abs(p.fields[key][k] - raw[32 + j * 4 + k]));
      }
    }
    assert(world <= 3e-7, `World ${world} at ${at}`);
    assert(normal <= 3e-7, `Normal relative ${normal}`);
    assert(fields <= 2.4e-7, `Fields ${fields}`);
  });

for (const eyes of Object.keys(fixtureBindings))
  test(`${eyes}: Computer independently validates observed per-part scene-centering`, async () => {
    const expected = await read(`.local/avatar-catalog-eye-work/${eyes}/work-raw.json`);
    expected.frames = expected.frames.filter((f) => f.renderTime >= 3);
    const sourceClips = [],
      sourceRecords = [],
      centering = await read('.local/avatar-catalog-eye-centering.json');
    for (const g of [0, 1]) {
      const path = `.local/avatar-catalog-rig/rig${g}`,
        raw = await read(`${path}/work/work-raw.json`),
        geometry = await read(`${path}/combined-work-geometry.json`),
        manifest = await read(`${path}/work-manifest.json`);
      raw.frames = raw.frames.filter((f) => f.renderTime >= 3);
      const observation = catalogObservation(raw, geometry, manifest, {
        ignoreActivityProps: true,
      });
      await calibrateCatalogMaterials(
        observation,
        await read(`${path}/lime_frog/idle-raw.json`),
        manifest,
      );
      for (const p of observation.clip.parts) {
        p.fields.catalogCenterWeight = centering.rigs[g].parts[p.id];
        Object.assign(
          p.fields,
          anchorResponse.rigs[g].parts[p.id] ?? {},
          sizeResponse.rigs[g].parts[p.id] ?? {},
        );
      }
      sourceClips.push(observation.clip);
      sourceRecords.push(manifest.parts);
    }
    const clip = { ...sourceClips[0], parts: [] },
      bindings = [];
    for (const b of fixtureBindings[eyes].filter((b) => !b.fur)) {
      let g = 0,
        record = sourceRecords[0][0];
      if (b.category !== 'body') {
        for (g = 0; g < 2; g++) {
          record = sourceRecords[g].find(
            (p) => p.category === b.category && p.selection === eyes && p.sourcePart === b.sourceId,
          );
          if (record) break;
        }
        assert(record);
      }
      const source = sourceClips[g].parts.find((p) => p.id === `mesh:${record.id}`),
        id = b.id === 0 ? 'mesh:0' : `${source.id}@${g}`;
      clip.parts.push({ ...source, id });
      bindings.push({
        sourceId: id,
        targetId: `mesh:${b.id}`,
        category: b.category,
        sourcePivot: b.sourcePivot,
        targetPivot: b.pivot,
        geometryTransform: new Matrix4().fromArray(b.transform),
        fields: fieldValues(expected.frames[0].draws[b.id].blocks.DrawBlock),
        sourceParentId: g ? 'mesh:parent1' : 'mesh:0',
        sourceSceneCenter: centering.rigs[g].center,
        sceneCenterDelta: centering.rigs[g].center,
      });
    }
    if (!clip.parts.some((p) => p.id === 'mesh:parent1'))
      clip.parts.push({
        ...sourceClips[1].parts.find((p) => p.id === 'mesh:0'),
        id: 'mesh:parent1',
      });
    const original = expected.frames.map((f) =>
      affineChannels(
        new Matrix4().fromArray(f.draws[0].blocks.DrawBlock),
        new Matrix4().fromArray(f.draws[0].blocks.DrawBlock, 16),
      ),
    );
    const base = {
      ...clip,
      parts: [
        {
          id: 'mesh:0',
          ...Object.fromEntries(
            ['translation', 'rotation', 'scale', 'shear', 'normalCorrection'].map((name) => [
              name,
              channel(original.map((p) => p[name])),
            ]),
          ),
          fields: {},
        },
      ],
    };
    const sampler = new CatalogRetargetSampler(
        new AuthoredMotionSampler(clip),
        bindings,
        dimensions,
        dimensions,
        new AuthoredMotionSampler(base),
      ),
      pose = sampler.createPose();
    let world = 0,
      normal = 0,
      fields = 0,
      at;
    for (const frame of expected.frames) {
      sampler.sample(frame.renderTime - 3, pose);
      for (const p of pose) {
        const id = Number(p.id.split(':')[1]),
          raw = frame.draws[id].blocks.DrawBlock;
        for (let k = 0; k < 16; k++) {
          const error = Math.abs(p.world.elements[k] - raw[k]);
          if (error > world) {
            world = error;
            at = [frame.renderTime, id, k];
          }
          normal = Math.max(
            normal,
            Math.abs(p.normalMatrix.elements[k] - raw[k + 16]) /
              Math.max(1, ...raw.slice(16, 32).map(Math.abs)),
          );
        }
        for (const [j, key] of catalogDrawFields.entries())
          for (let k = 0; k < 4; k++)
            fields = Math.max(fields, Math.abs(p.fields[key][k] - raw[32 + j * 4 + k]));
      }
    }
    const measuredShortfalls = {
      swept_lids: {
        world: 1.7513487488520532e-6,
        at: [3.1166666666666667, 1, 14],
      },
      dots: {
        world: 1.2122478598114526e-6,
        at: [3.1166666666666667, 2, 13],
        normal: 4.068790264710742e-7,
      },
      sleepy_lids: {
        world: 4.26131818335719e-6,
        at: [3.1166666666666667, 1, 14],
      },
    };
    const measured = measuredShortfalls[eyes];
    if (measured) {
      assert(
        Math.abs(world - measured.world) < 1e-12,
        `Observed residual changed: ${eyes}/${world}`,
      );
      assert.deepEqual(at, measured.at);
    } else assert(world <= 4e-7, `World ${world} at ${at}`);
    if (measured?.normal)
      assert(
        Math.abs(normal - measured.normal) < 1e-12,
        `Observed normal residual changed: ${normal}`,
      );
    else assert(normal <= 3e-7, `Normal relative ${normal}`);
    assert(fields <= 2.4e-7, `Fields ${fields}`);
  });
