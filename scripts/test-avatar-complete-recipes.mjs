import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const tmp = await mkdtemp('.local/complete-recipes-test-');
const library = JSON.parse(
  await readFile('runtime/avatar/assets/catalog-library/index.json', 'utf8'),
);
for (const [source, name] of [
  ['runtime/avatar/recipe.ts', 'recipe'],
  ['src/agent-avatar/character-colors.ts', 'colors'],
  ['src/agent-avatar/expression-rig.ts', 'expression-rig'],
  ['src/agent-avatar/character-preset-defaults.ts', 'preset-defaults'],
]) {
  let code = ts.transpileModule(await readFile(source, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText;
  code = code
    .replace("'../../src/agent-avatar/character-preset-defaults'", "'./preset-defaults.mjs'")
    .replace(
      "'../../src/agent-avatar/expression-rig'",
      "'./expression-rig.mjs'",
    )
    .replace("'../../src/agent-avatar/character-colors'", "'./colors.mjs'")
    .replace(
      /import catalog from .*;/,
      `const catalog=${JSON.stringify(library)};`,
    );
  await writeFile(`${tmp}/${name}.mjs`, code);
}
const { resolveCompleteEditorRecipe: resolve } = await import(
  pathToFileURL(`${process.cwd()}/${tmp}/recipe.mjs`)
);
test.after(() => rm(tmp, { recursive: true, force: true }));
const props = (character, extra = {}) => ({
  config: { character, motion: 1 },
  reduced: false,
  ...extra,
});
test('all catalog combinations have distinct complete geometry identities and preserve selected options', () => {
  const keys = new Set();
  for (const shape of Object.keys(library.donors.body))
    for (const eyes of Object.keys(library.donors.eyes))
      for (const eyewear of Object.keys(library.donors.eyewear))
        for (const accessory of Object.keys(library.donors.accessory)) {
          const selections = { shape, eyes, eyewear, accessory };
          const recipe = resolve(props({ preset: 'lime_frog', selections }));
          assert(recipe.preset.startsWith('catalog:'));
          assert(recipe.catalog);
          for (const [k, v] of Object.entries(selections))
            assert.equal(recipe.capabilities.selected[k], v);
          assert.equal(
            recipe.catalog.shape,
            shape === 'todd' ? 'rounded_head_two_ears' : shape,
          );
          assert.equal(recipe.color, '#b6d80b');
          keys.add(recipe.preset);
        }
  // The saved Todd alias denotes the native rounded-head body. All other
  // choices are independent and must never collapse to a preset approximation.
  assert.equal(keys.size, 20 * 12 * 6 * 10);
});
test('paint stays per-instance and RGB takes precedence over a palette choice', () => {
  const selections = { shape: 'clippo', eyes: 'cyclops', accessory: 'crown' };
  const a = resolve(props({ preset: 'gus', selections }));
  const b = resolve(
    props({
      preset: 'gus',
      selections: { ...selections, color: 'coral' },
      bodyColor: '#123456',
    }),
  );
  assert.equal(a.preset, b.preset);
  assert.equal(a.color, '#ffd838');
  assert.equal(b.color, '#123456');
  assert.equal(b.capabilities.selected.bodyColor, '#123456');
  assert.equal(b.capabilities.selected.color, undefined);
});
test('isolated eyes have a separate asset identity without changing the saved configuration', () => {
  const character = { preset: 'alfred' };
  const full = resolve(props(character));
  const eyes = resolve(props(character, { previewPart: 'eyes' }));
  assert.equal(eyes.catalog.previewPart, 'eyes');
  assert.equal(eyes.catalog.eyes, 'sleepy_lids');
  assert.notEqual(full.preset, eyes.preset);
  assert.deepEqual(character, { preset: 'alfred' });
});
test('personalized configuration has no preset dependency and keeps its exact saved color', () => {
  const character = {
    selections: {shape:'heart',eyes:'clippo',eyewear:'monocle',accessory:'bow'},
    bodyColor:'#000000',
  };
  const result=resolve(props(character));
  assert.deepEqual(result.catalog,character.selections);
  assert.equal(result.color,'#000000');
  assert.deepEqual(result.capabilities.selected,{...character.selections,bodyColor:'#000000'});
  assert.throws(()=>resolve(props({selections:{eyes:'clippo'}})), /complete parts/);
});
test('saved contours retain every point and participate in cache identity', () => {
  const points = Array.from({ length: 16 }, (_, i) => [
    Math.cos((i * Math.PI) / 8),
    Math.sin((i * Math.PI) / 8),
  ]);
  const legacy = {
    points,
    eyes: 'oval',
    patch: { bodyColor: '#aabbcc' },
    selections: { accessory: 'hat' },
  };
  const a = resolve(props(undefined, { legacy }));
  assert.deepEqual(a.catalog.points, points);
  assert.equal(a.color, '#aabbcc');
  assert.equal(a.catalog.accessory, 'hat');
  const other = structuredClone(legacy);
  other.points[0][0] = 1.1;
  assert.notEqual(
    a.preset,
    resolve(props(undefined, { legacy: other })).preset,
  );
});
test('actions and gaze retain geometry; invalid selections throw instead of switching engines', () => {
  const character = { preset: 'clippo', selections: { eyes: 'clippo' } };
  const a = resolve(props(character));
  assert.equal(
    a.preset,
    resolve(
      props(character, {
        workingCycles: 3,
        entranceKey: 2,
        config: { character, lookAt: 'left' },
      }),
    ).preset,
  );
  for (const selections of [
    { shape: 'missing' },
    { eyes: 'missing' },
    { color: 'missing' },
  ])
    assert.throws(
      () => resolve(props({ preset: 'alfred', selections })),
      /Unknown avatar/,
    );
  assert.throws(
    () => resolve(props({ preset: '__proto__' })),
    /Unknown avatar preset/,
  );
});

test('face false removes named preset eyes without losing its selected accessories', () => {
  const value = resolve({
    config: { character: { preset: 'alfred' }, face: false },
    reduced: false,
  });
  assert.equal(value.catalog.eyes, 'none');
  assert.equal(value.catalog.accessory, 'bow');
  assert.equal(value.catalog.eyewear, 'tall_oval_frames');
  assert.equal(value.capabilities.selected.eyes, 'none');
});
test('Alien keeps expression, tilt, size, spacing and light-eye material in asset identity', () => {
  const config = {
    family: 'alien',
    face: true,
    eyeSize: 27,
    eyeGap: 61,
    eyeTilt: 13,
    lightEyes: true,
    eyes: 'wink',
    expression: 100,
    idle: false,
  };
  const input = {
    config,
    reduced: false,
    legacy: {
      shape: 'circle',
      eyes: 'alien',
      patch: { bodyColor: '#00ff88' },
      eyeSpacing: 1.2,
    },
  };
  const value = resolve(input);
  assert.equal(value.catalog.eyes, 'alien');
  assert.equal(value.catalog.alienFace.size, 27);
  assert.equal(value.catalog.alienFace.gap, 61 * 1.2);
  assert.equal(value.catalog.alienFace.light, true);
  assert.equal(value.catalog.alienFace.tilt, (13 * Math.PI) / 180);
  assert.ok(
    value.catalog.alienFace.rig.rightOpen <
      value.catalog.alienFace.rig.leftOpen,
  );
  assert.notEqual(
    value.preset,
    resolve({ ...input, config: { ...config, eyes: 'neutral' } }).preset,
  );
});
test('eye spacing is explicit geometry state, validated independently of the named preset', () => {
  const a = resolve(props({ preset: 'blue_beret', eyeSpacing: 0.7 })),
    b = resolve(props({ preset: 'blue_beret', eyeSpacing: 1.3 }));
  assert.equal(a.catalog.eyeSpacing, 0.7);
  assert.equal(b.catalog.eyeSpacing, 1.3);
  assert.notEqual(a.preset, b.preset);
  for (const eyeSpacing of [0, 2, NaN, Infinity])
    assert.throws(
      () => resolve(props({ preset: 'alfred', eyeSpacing })),
      /Invalid avatar eye spacing/,
    );
});
