import assert from 'node:assert/strict';
import test from 'node:test';
import { MIGRATED_CONTOURS } from '../assets/character-runtime/migrated-contours.mjs';
import { sourceContours } from './generate-avatar-contours.mjs';
import {
  withCharacterGeometry,
  characterRecipe,
  authoredPartsFor,
} from '../assets/character-runtime/character-recipe.mjs';
test('packaged contour data is exactly the original shared geometry on all eight bodies', () => {
  assert.deepEqual(MIGRATED_CONTOURS, sourceContours());
  for (const points of Object.values(MIGRATED_CONTOURS)) {
    assert.equal(points.length, 256);
    assert.ok(points.flat().every(Number.isFinite));
  }
});
test('canonical contour geometry preserves preset, palette, RGB and every selected part', () => {
  for (const shape of Object.keys(MIGRATED_CONTOURS)) {
    const recipe = {
      preset: 'blue_beret',
      selections: {
        shape,
        color: 'teal',
        eyes: 'cyclops',
        eyewear: 'monocle',
        accessory: 'headphones',
      },
      eyeSpacing: 0.7,
    };
    const original = { config: { character: recipe } };
    const props = withCharacterGeometry(original);
    assert.equal(characterRecipe(props), recipe);
    assert.deepEqual(props.legacy.points, MIGRATED_CONTOURS[shape]);
    assert.equal(original.legacy, undefined);
    assert.equal(authoredPartsFor(props).bodyPreset, undefined);
    assert.equal(authoredPartsFor(props).eyes, 'cyclops');
    assert.equal(authoredPartsFor(props).accessory, 'headphones');
    assert.equal(authoredPartsFor(props).eyeSpacing, 0.7);
    const explicit = {
      ...props,
      legacy: {
        points: [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1],
        ],
        patch: { bodyColor: '#fac9b8' },
      },
    };
    assert.equal(withCharacterGeometry(explicit).legacy, explicit.legacy);
    assert.equal(characterRecipe(explicit).bodyColor, undefined);
  }
});
test('canonical legacy starting recipe keeps explicit named paint and defaults without preset inheritance', () => {
  const props = withCharacterGeometry({
    config: {
      character: {
        preset: 'legacy',
        selections: {
          shape: 'cloud',
          color: 'blue',
          eyes: 'oval',
          eyewear: 'none',
          accessory: 'none',
        },
      },
    },
  });
  assert.equal(characterRecipe(props).preset, 'legacy');
  assert.equal(characterRecipe(props).selections.color, 'blue');
  assert.deepEqual(authoredPartsFor(props), {
    eyes: 'oval',
    eyewear: 'none',
    accessory: 'none',
  });
});
