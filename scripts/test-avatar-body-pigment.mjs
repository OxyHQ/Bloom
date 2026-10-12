import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { Color } from 'three';
import ts from 'typescript';
const temp = await mkdtemp('.local/body-pigment-test-');
await writeFile(
  `${temp}/pigment.mjs`,
  ts.transpileModule(await readFile('src/agent-avatar/body-pigment.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText,
);
const { boundBodyPigment: bound, bodyPigmentHex } = await import(
  pathToFileURL(`${process.cwd()}/${temp}/pigment.mjs`)
);
test.after(() => rm(temp, { recursive: true, force: true }));
const luminance = (c) => c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722;
test('all RGB regions stay in gamut with readable pigment, including black and white', () => {
  for (let r = 0; r <= 255; r += 17)
    for (let g = 0; g <= 255; g += 17)
      for (let b = 0; b <= 255; b += 17) {
        const color = new Color((r << 16) | (g << 8) | b);
        bound(color);
        assert(luminance(color) >= 0.21 - 1e-10);
        assert(luminance(color) <= 0.68 + 1e-10);
        assert(color.toArray().every((c) => c >= 0 && c <= 1));
        const before = color.clone();
        bound(color);
        assert(color.toArray().every((v, i) => Math.abs(v - before.toArray()[i]) < 1e-10));
      }
});
test('catalog palette is unchanged and pure blue is lifted according to luminance', () => {
  for (const hex of [
    '#fa70ab',
    '#dd6adc',
    '#a25bff',
    '#4778ff',
    '#00b1ff',
    '#04bb9f',
    '#b6d80b',
    '#ffcc38',
    '#ff8066',
  ]) {
    const c = new Color(hex),
      before = c.clone();
    bound(c);
    assert.deepEqual(c, before);
  }
  const c = new Color('#0000ff');
  bound(c);
  assert(c.r > 0 && c.g > 0);
  assert.equal(c.b, 1);
});

test('selector sRGB matches the renderer pigment across the RGB cube and named palette', () => {
  const samples = [
    '#000000',
    '#ffffff',
    '#080019',
    '#0000ff',
    '#fff',
    '#fa70ab',
    '#dd6adc',
    '#a25bff',
    '#4778ff',
    '#00b1ff',
    '#04bb9f',
    '#b6d80b',
    '#ffcc38',
    '#ff8066',
  ];
  for (let r = 0; r <= 255; r += 17)
    for (let g = 0; g <= 255; g += 17)
      for (let b = 0; b <= 255; b += 17)
        samples.push('#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0'));
  for (const hex of samples) {
    const engine = new Color(hex);
    bound(engine);
    assert.equal(bodyPigmentHex(hex), '#' + engine.getHexString(), hex);
  }
  assert.notEqual(bodyPigmentHex('#000000'), '#000000');
  assert.notEqual(bodyPigmentHex('#ffffff'), '#ffffff');
  assert.equal(bodyPigmentHex('#4778ff'), '#4778ff');
});
