import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { InstancedBufferGeometry, Float32BufferAttribute } from 'three';
import { createHash } from 'node:crypto';
import { avatarFixture, fixtureAssembly } from './avatar-test-fixtures.mjs';
const fixture = await avatarFixture('contour');
const temp = await mkdtemp('.local/catalog-contour-test-');
for (const file of ['catalog-contour', 'catalog-fitting'])
  await writeFile(
    `${temp}/${file}.mjs`,
    ts
      .transpileModule(await readFile(`runtime/avatar/${file}.ts`, 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
      })
      .outputText.replace("'./catalog-fitting'", "'./catalog-fitting.mjs'"),
  );
const { deformCatalogContour } = await import(
  pathToFileURL(`${process.cwd()}/${temp}/catalog-contour.mjs`)
);
test.after(() => rm(temp, { recursive: true, force: true }));
for (const lod of ['low', 'high']) {
  const source = fixtureAssembly(fixture[lod].source);
  for (const [id, expected] of Object.entries(fixture[lod].cases))
    test(`${lod}/${id}: positions, morphs, normals and fur tangents retain the frozen contour contract`, () => {
      const actual = deformCatalogContour(source, expected.points);
      for (let p = 0; p < expected.parts.length; p++)
        for (const [name, hash] of Object.entries(expected.parts[p])) {
          const values = actual.pieces[p].geometry.getAttribute(name).array;
          assert.equal(
            createHash('sha256')
              .update(Buffer.from(values.buffer, values.byteOffset, values.byteLength))
              .digest('hex'),
            hash,
            `${p}/${name}`,
          );
        }
      assert.notEqual(actual.body.geometry, source.body.geometry);
    });
}
