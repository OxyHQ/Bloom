import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { Matrix4 } from 'three';
import ts from 'typescript';
const temp = await mkdtemp('.local/catalog-hat-test-');
for (const name of ['motion', 'catalog-retarget', 'catalog-accessory-material'])
  await writeFile(
    `${temp}/${name}.mjs`,
    ts
      .transpileModule(await readFile(`runtime/avatar/${name}.ts`, 'utf8'), {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ES2022,
        },
      })
      .outputText.replace("'./motion'", "'./motion.mjs'"),
  );
const load = (name) => import(pathToFileURL(`${process.cwd()}/${temp}/${name}.mjs`));
const { preserveCatalogAccessoryMaterial } = await load('catalog-accessory-material');
const { CatalogRetargetSampler } = await load('catalog-retarget');
const { AuthoredMotionSampler } = await load('motion');
test.after(() => rm(temp, { recursive: true, force: true }));
for (const detail of ['low', 'high']) {
  const donor = JSON.parse(
    await readFile(
      `runtime/avatar/assets/catalog-library/accessory/felipe_beret/${detail}/material.json`,
      'utf8',
    ),
  );
  const reference = JSON.parse(
    await readFile('runtime/avatar/assets/blue_beret/material.json', 'utf8'),
  );
  for (const kind of ['idle', 'reaction', 'work'])
    test(`${detail} ${kind}: three Felipe beret parts keep original shader, RGB, roughness and reflectance through retarget`, () => {
      for (const source of donor.parts.filter((p) => p.category === 'accessory')) {
        const before = JSON.stringify(source);
        const fields = structuredClone(source.fields);
        const binding = {
          sourcePart: { ...source, selection: 'felipe_beret' },
          part: { category: 'accessory', universal: true, fields },
          preserveFields: ['coverage'],
        };
        preserveCatalogAccessoryMaterial(binding);
        preserveCatalogAccessoryMaterial(binding);
        assert.equal(binding.part.universal, false);
        assert.equal(binding.preserveMaterial, true);
        assert.deepEqual(binding.preserveFields, ['coverage', 'colorRoughness', 'parameters']);
        const native = reference.parts.find((p) => p.label === source.label);
        for (const field of ['colorRoughness', 'parameters'])
          assert.deepEqual(fields[field], native.fields[field]);
        const observedPart = (id) => ({
          id,
          translation: { samples: [0, 0, 0, 0.2, 0.1, 0] },
          rotation: { value: [0, 0, 0, 1] },
          scale: { value: [1, 1, 1] },
          fields: {
            colorRoughness: {
              value: [0.013411746, 0.013411746, 0.013411746, 0.82],
            },
            parameters: { value: [0.16, 0, 0, 0] },
            signatureDeform: { samples: [0, 0, 0, 0, 1, 2, 3, 4] },
          },
        });
        const clip = {
          duration: 1,
          loop: kind === 'idle',
          times: [0, 1],
          parts: [observedPart('mesh:0'), observedPart('mesh:1')],
        };
        const bodyBinding = {
          sourceId: 'mesh:0',
          targetId: 'mesh:0',
          category: 'body',
          sourcePivot: [0, 0, 0],
          targetPivot: [0, 0, 0],
          geometryTransform: new Matrix4(),
          fields: structuredClone(fields),
        };
        const base =
          kind === 'work'
            ? new AuthoredMotionSampler({
                ...clip,
                parts: [observedPart('mesh:0')],
              })
            : undefined;
        const sampler = new CatalogRetargetSampler(
          new AuthoredMotionSampler(clip),
          [
            bodyBinding,
            {
              ...bodyBinding,
              sourceId: 'mesh:1',
              targetId: 'mesh:1',
              category: 'accessory',
              fields,
              preserveFields: binding.preserveFields,
            },
          ],
          { ground: -1, height: 2 },
          { ground: -1, height: 2 },
          base,
        );
        const pose = sampler.createPose();
        sampler.sample(0.5, pose);
        for (const field of ['colorRoughness', 'parameters'])
          assert.deepEqual(Array.from(pose[1].fields[field]), native.fields[field]);
        assert.deepEqual(Array.from(pose[1].fields.signatureDeform), [0.5, 1, 1.5, 2]);
        assert.equal(JSON.stringify(source), before);
      }
    });
}
test('other accessories retain their observed material behavior', () => {
  for (const selection of ['beret', 'hat', 'bow', 'three_lobe']) {
    const binding = {
      sourcePart: { selection },
      part: {
        category: 'accessory',
        universal: true,
        fields: { colorRoughness: [0.1, 0.2, 0.3, 0.82] },
      },
    };
    const before = structuredClone(binding);
    preserveCatalogAccessoryMaterial(binding);
    assert.deepEqual(binding, before);
  }
});

test('Felipe donor uses the original mesh, vertex normals, morph targets and indices byte for byte', async () => {
  const donor = await readFile(
    'runtime/avatar/assets/catalog-library/accessory/felipe_beret/high/geometry.bin',
  );
  const original = await readFile('runtime/avatar/assets/blue_beret/geometry.bin');
  assert.equal(donor.equals(original), true);
});
