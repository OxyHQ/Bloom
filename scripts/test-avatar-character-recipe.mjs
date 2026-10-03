import assert from 'node:assert/strict';
import test from 'node:test';
import {
  characterRecipe,
  authoredPartsFor,
} from '../assets/character-runtime/character-recipe.mjs';

const props = (character) => ({ config: { character } });
test('Clippo defaults resolve without altering the saved recipe', () => {
  const p = props({ preset: 'clippo' });
  assert.deepEqual(characterRecipe(p), {
    preset: 'clippo',
    selections: { shape: 'clippo', eyes: 'clippo' },
    bodyColor: '#999b9d',
  });
  assert.deepEqual(p.config.character, { preset: 'clippo' });
  assert.deepEqual(authoredPartsFor(p), { shape: 'clippo', eyes: 'clippo' });
});
test('Clippo independently accepts shape, eye, accessory and color overrides', () => {
  const p = props({
    preset: 'clippo',
    selections: {
      shape: 'heart',
      eyes: 'todd',
      color: 'pink',
      accessory: 'felipe_beret',
    },
  });
  assert.equal(characterRecipe(p).bodyColor, undefined);
  assert.deepEqual(authoredPartsFor(p), {
    eyes: 'todd',
    accessory: 'felipe_beret',
  });
  assert.equal(
    characterRecipe(props({ ...p.config.character, bodyColor: '#123456' }))
      .bodyColor,
    '#123456',
  );
  assert.deepEqual(
    authoredPartsFor(props({ preset: 'clippo', selections: { eyes: 'oval' } })),
    { shape: 'clippo' },
  );
});
test('all authored parts compose on migrated and native shapes without leaking the preset body', () => {
  const selections = { eyes: 'clippo', accessory: 'felipe_beret' };
  assert.deepEqual(
    authoredPartsFor(props({ preset: 'alfred', selections })),
    selections,
  );
  const p = {
    ...props({ preset: 'clippo' }),
    legacy: { shape: 'circle', eyes: 'oval', selections },
  };
  assert.deepEqual(authoredPartsFor(p), selections);
  assert.equal(characterRecipe(p).preset, 'legacy');
  assert.equal(characterRecipe(p).selections.shape, 'circle');
});
test('intact Todd and Felipe keep their original preset and edited variants keep their authored parts', () => {
  for (const preset of ['lime_frog', 'blue_beret']) {
    const p = props({ preset });
    assert.equal(characterRecipe(p), p.config.character);
    assert.deepEqual(authoredPartsFor(p), {});
  }
  assert.deepEqual(
    authoredPartsFor(props({ preset: 'lime_frog', bodyColor: '#123456' })),
    { eyes: 'todd' },
  );
  assert.deepEqual(
    authoredPartsFor(
      props({ preset: 'blue_beret', selections: { shape: 'clippo' } }),
    ),
    { shape: 'clippo', accessory: 'felipe_beret' },
  );
});
