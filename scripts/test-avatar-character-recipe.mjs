import assert from 'node:assert/strict';
import test from 'node:test';
import {
  characterRecipe,
  authoredPartsFor,
  bodySignatureFor,
  bodySelectionDefaults,
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
    { shape: 'clippo', eyes: 'oval' },
  );
});
test('all authored parts compose on migrated and native shapes without leaking the preset body', () => {
  const selections = { eyes: 'clippo', accessory: 'felipe_beret' };
  assert.deepEqual(authoredPartsFor(props({ preset: 'alfred', selections })), {
    bodyPreset: 'alfred',
    ...selections,
  });
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
    { bodyPreset: 'lime_frog', paintBody: true, eyes: 'todd' },
  );
  assert.deepEqual(
    authoredPartsFor(
      props({ preset: 'blue_beret', selections: { shape: 'clippo' } }),
    ),
    { shape: 'clippo', accessory: 'felipe_beret' },
  );
});

test('native eyes, eyewear, accessories and explicit spacing keep the actual named body', () => {
  for (const preset of [
    'blue_beret',
    'alfred',
    'purple_heart',
    'lime_frog',
    'coral_monocle',
    'gus',
    'blue_spectacles',
    'lime_headphones',
  ]) {
    const input = props({
      preset,
      selections: { eyes: 'oval', eyewear: 'monocle', accessory: 'crown' },
      eyeSpacing: 1.3,
    });
    const parts = authoredPartsFor(input);
    assert.equal(parts.bodyPreset, preset);
    assert.equal(parts.eyes, 'oval');
    assert.equal(parts.eyewear, 'monocle');
    assert.equal(parts.accessory, 'crown');
    assert.equal(parts.eyeSpacing, 1.3);
    assert.equal(input.config.character.selections.shape, undefined);
  }
  const legacy = {
    legacy: {
      shape: 'circle',
      eyes: 'cyclops',
      eyeSpacing: 0.7,
      patch: { bodyColor: '#abcdef' },
    },
    config: {},
  };
  assert.equal(characterRecipe(legacy).eyeSpacing, 0.7);
  assert.equal(authoredPartsFor(legacy).eyeSpacing, 0.7);
  assert.equal(authoredPartsFor(legacy).bodyPreset, undefined);
});
test('explicit Todd body keeps the chosen paint and pieces independently of preset', () => {
  assert.deepEqual(
    authoredPartsFor(
      props({
        preset: 'clippo',
        selections: {
          shape: 'todd',
          color: 'pink',
          eyes: 'dots',
          eyewear: 'none',
          accessory: 'none',
        },
      }),
    ),
    {
      bodyPreset: 'lime_frog',
      paintBody: true,
      eyes: 'dots',
      eyewear: 'none',
      accessory: 'none',
    },
  );
});
test('signature identity follows the actual body independently of preset seed and edited pieces', () => {
  const shapes = {
    six_lobed_flower: 'blue_beret',
    rounded_triangle: 'alfred',
    heart: 'purple_heart',
    rounded_head_two_ears: 'lime_frog',
    twelve_scalloped_rosette: 'coral_monocle',
    rounded_diamond: 'gus',
    rounded_cube: 'blue_spectacles',
    circle_two_ears: 'lime_headphones',
    todd: 'lime_frog',
  };
  for (const [shape, expected] of Object.entries(shapes))
    for (const preset of ['clippo', 'purple_heart', 'lime_frog'])
      assert.equal(
        bodySignatureFor(
          props({
            preset,
            selections: { shape, eyes: 'cyclops', accessory: 'headphones' },
          }),
        ),
        expected,
      );
  for (const preset of Object.values(shapes)) {
    assert.equal(bodySignatureFor(props({ preset })), preset);
    assert.equal(
      bodySignatureFor(
        props({ preset, selections: { eyes: 'dots' }, bodyColor: '#123456' }),
      ),
      preset,
    );
  }
  assert.equal(bodySignatureFor(props({ preset: 'clippo' })), 'lime_frog');
  assert.equal(
    bodySignatureFor({
      legacy: {
        points: [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1],
        ],
        shape: 'heart',
        patch: { bodyColor: '#123456' },
      },
      config: {},
    }),
    'lime_frog',
  );
  assert.equal(
    bodySignatureFor({
      legacy: { shape: 'heart', patch: { bodyColor: '#123456' } },
      config: {},
    }),
    'purple_heart',
  );
});
test('authored body capability defaults replace neutral fitting choices and retain virtual identities', () => {
  const neutral = {
    shape: 'circle',
    eyes: 'dots',
    eyewear: 'none',
    accessory: 'none',
  };
  for (const [preset, appearance] of Object.entries({
    purple_heart: {
      shape: 'heart',
      eyes: 'oval',
      eyewear: 'round_sunglasses',
      accessories: [],
    },
    gus: {
      shape: 'rounded_diamond',
      eyes: 'oval',
      eyewear: 'classic_sunglasses',
      accessories: ['orb'],
    },
  })) {
    const selected = {
      ...neutral,
      ...bodySelectionDefaults(preset, appearance),
    };
    assert.equal(selected.shape, appearance.shape);
    assert.equal(selected.eyes, 'oval');
    assert.equal(selected.eyewear, appearance.eyewear);
    assert.equal(selected.accessory, appearance.accessories[0] ?? 'none');
    assert.equal({ ...selected, eyes: 'cyclops' }.eyes, 'cyclops');
  }
  assert.deepEqual(
    bodySelectionDefaults('lime_frog', {
      shape: 'rounded_head_two_ears',
      eyes: 'round_inset',
      accessories: ['bow'],
    }),
    { shape: 'todd', eyes: 'todd', eyewear: 'none', accessory: 'bow' },
  );
  assert.equal(
    bodySelectionDefaults('blue_beret', {
      shape: 'six_lobed_flower',
      eyes: 'oval',
      accessories: ['beret'],
    }).accessory,
    'felipe_beret',
  );
});
