/** Compare against frozen independently observed Clippo geometry. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { InstancedBufferGeometry, Float32BufferAttribute } from 'three';
import { avatarFixture, fixtureAssembly } from './avatar-test-fixtures.mjs';
const fixture = await avatarFixture('clippo');
const temp = await mkdtemp('.local/catalog-clippo-test-');
for (const file of ['catalog-clippo', 'catalog-fitting'])
  await writeFile(
    `${temp}/${file}.mjs`,
    ts.transpileModule(await readFile(`runtime/avatar/${file}.ts`, 'utf8'), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    }).outputText,
  );
const { fitClippoEyes } = await import(
  pathToFileURL(`${process.cwd()}/${temp}/catalog-clippo.mjs`)
);
const { transformCatalogPiece } = await import(
  pathToFileURL(`${process.cwd()}/${temp}/catalog-fitting.mjs`)
);
test.after(() => rm(temp, { recursive: true, force: true }));
for (const lod of ['low', 'high']) {
  const donor = fixtureAssembly(fixture[lod].donor),
    construction = fixture[lod].construction;
  for (const [id, expected] of Object.entries(fixture[lod].cases))
    test(`${id}/${lod}: Clippo eyes and brows retain observed vertices and morphs`, () => {
      const placements = fitClippoEyes(fixtureAssembly(expected.target), donor, construction);
      assert.equal(placements.length, 6);
      let error = 0;
      for (let j = 0; j < placements.length; j++) {
        const actual = transformCatalogPiece(placements[j].placement.part, placements[j].placement);
        for (const [name, values] of Object.entries(expected.expected[j])) {
          const attr = actual.geometry.getAttribute(name);
          assert.equal(attr.array.length, values.length);
          for (let i = 0; i < values.length; i++)
            error = Math.max(error, Math.abs(attr.array[i] - values[i]));
        }
        actual.geometry.dispose();
      }
      assert(error <= 2.4e-7, `maximum semantic geometry residual ${error}`);
    });
}
