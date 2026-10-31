import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
const temporary = await mkdtemp('.local/avatar-frame-shader-');
await writeFile(
  `${temporary}/shader.mjs`,
  ts.transpileModule(await readFile('runtime/avatar/frame-shader.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText,
);
const { createFrameShaderSpecializer } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/shader.mjs`).href
);
test.after(() => rm(temporary, { recursive: true, force: true }));
const source =
  'f.effects.x > 0.0|f.effects.y>0.|f.studioParameters.x > 0.|f.studioParameters.x <= 0.|f.thinkingLightPositionStrength.w <= 0.|f.studioParameters.z == 1.|f.studioParameters.z == 2.|f.studioParameters.z == 3.';
test('immutable predicates use the uploaded float32 value, not double precision or a truthiness shortcut', () => {
  const specialize = createFrameShaderSpecializer(source);
  for (const number of [-1, 0, -0, 1e-60, 1e-8, 1, 2, 3, 4, 1 + 1e-8]) {
    const value = Math.fround(number),
      positive = value > 0;
    const actual = specialize({
      effects: [number, number],
      studioParameters: [number, 17, number],
      thinkingLightPositionStrength: [1, 2, 3, number],
    });
    assert.equal(
      actual,
      [
        positive,
        positive,
        positive,
        !positive,
        !positive,
        value === 1,
        value === 2,
        value === 3,
      ].join('|'),
    );
  }
});
test('missing uniforms preserve generic behavior and continuous lighting numbers do not create program variants', () => {
  const specialize = createFrameShaderSpecializer(source);
  assert.equal(specialize({}), source);
  const first = {
    effects: [0, 1, 1.1, 0.2],
    studioParameters: [1, 1.05, 0, 0.18],
    thinkingLightPositionStrength: [0, 0, 0, 0],
  };
  const second = {
    ...first,
    effects: [0, 1, 77, 99],
    studioParameters: [1, 0.22, 0, 0.9],
    thinkingLightPositionStrength: [500, -10, 6, 0],
    cameraPosition: [1, 2, 3, 0],
  };
  assert.equal(specialize(first), specialize(second));
});
