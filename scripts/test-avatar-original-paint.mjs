import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeAppearance } from '../assets/character-runtime/appearance-codec.mjs';
import { originalPalettePaint } from '../assets/character-runtime/catalog-parts.mjs';
const appearance = (color) =>
  encodeAppearance({
    version: 1,
    shape: 'circle',
    color,
    eyes: 'oval',
    eyewear: 'none',
    accessories: [],
    accessoryColors: {},
    constrained: 0,
    depth: 0.5,
    model: null,
    rig: null,
    hereCharacter: null,
  });

test('named original paint keeps the actual palette choice without preparing a replacement', () => {
  const module = {
    presetAppearance: () => appearance('blue'),
    catalog: () => [{ id: 'blue' }, { id: 'yellow' }],
    orbitPrepareAssembly() {
      assert.fail('named paint must not be sampled or approximated');
    },
  };
  assert.deepEqual(originalPalettePaint(module, 'named-paint-fixture'), {
    color: 'blue',
  });
});

test('an unnamed original paint uses a valid backing but preserves the actual source material RGB', () => {
  const bytes = new Uint8Array(48);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 1, true);
  view.setUint32(28, 1, true);
  for (const [index, value] of [1, 216 / 255, 56 / 255].entries())
    view.setFloat32(32 + index * 4, value, true);
  let preparations = 0;
  const module = {
    presetAppearance: () => appearance('light_yellow'),
    catalog: () => [{ id: 'blue' }, { id: 'yellow' }],
    orbitPrepareAssembly() {
      preparations++;
      return { bytes };
    },
  };
  for (let i = 0; i < 2; i++)
    assert.deepEqual(originalPalettePaint(module, 'unnamed-paint-fixture'), {
      color: 'yellow',
      bodyColor: '#ffd838',
    });
  assert.equal(preparations, 1);
});
