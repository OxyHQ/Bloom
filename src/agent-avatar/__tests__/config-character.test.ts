import { parseCharacterConfig } from '../config-character';
import { FOLD_CONFIG, parsePreset } from '../model';

it('round-trips optional character selections without changing the procedural fallback', () => {
  const character = {
    preset: 'blue_beret',
    selections: { shape: 'heart', eyes: 'oval' },
    bodyColor: '#03afbc',
  };
  const saved = parsePreset(
    JSON.parse(
      JSON.stringify({ name: 'Saved', config: { ...FOLD_CONFIG, character } }),
    ),
  );
  expect(saved.config).toEqual({ ...FOLD_CONFIG, character });
  expect(saved.config.character).not.toBe(character);
  expect(
    parsePreset({ name: 'Current', config: FOLD_CONFIG }).config.character,
  ).toBeUndefined();
  const parsed = parseCharacterConfig(character);
  character.selections.shape = 'circle';
  expect(parsed.selections?.shape).toBe('heart');
});

it.each([
  null,
  [],
  { preset: '' },
  { preset: 'x'.repeat(64) },
  { preset: 'blue_beret', selections: { material: 'solid' } },
  { preset: 'blue_beret', selections: { shape: '' } },
  { preset: 'blue_beret', state: [0, 255] },
])('rejects malformed persisted character data %#', (character) => {
  expect(() =>
    parsePreset({ name: 'Invalid', config: { ...FOLD_CONFIG, character } }),
  ).toThrow();
});

it('canonicalizes custom RGB while preserving all legacy recipe settings', () => {
  const input = {
    ...FOLD_CONFIG,
    lookAt: 'top-left' as const,
    foldShape: 'shield' as const,
    character: {
      preset: 'blue_beret',
      bodyColor: '#Aa00Ff',
      selections: { accessory: 'bow' },
    },
  };
  expect(parsePreset({ name: 'Custom', config: input }).config).toEqual({
    ...input,
    character: { ...input.character, bodyColor: '#aa00ff' },
  });
  expect(input.character.bodyColor).toBe('#Aa00Ff');
  expect(parseCharacterConfig({ preset: 'blue_beret' })).not.toHaveProperty(
    'bodyColor',
  );
});

it.each([
  '#abc',
  '#12345678',
  'abcdef',
  ' #abcdef',
  '#abcdef\n',
  '#gg0000',
  '',
  null,
  0,
])('rejects invalid custom RGB %#', (bodyColor) => {
  expect(() =>
    parseCharacterConfig({ preset: 'blue_beret', bodyColor }),
  ).toThrow('Invalid character body color');
});

it('round-trips the named Clippo preset and independently reusable Clippo body and eyes', () => {
  for (const character of [
    { preset: 'clippo' },
    { preset: 'blue_beret', selections: { shape: 'clippo', eyes: 'todd' } },
    {
      preset: 'blue_beret',
      selections: { shape: 'todd', eyes: 'cyclops' },
      eyeSpacing: 0.8,
    },
    {
      preset: 'alfred',
      selections: { shape: 'heart', eyes: 'clippo' },
      bodyColor: '#999b9d',
    },
  ]) {
    const saved = JSON.parse(
      JSON.stringify({ name: 'Clippo', config: { ...FOLD_CONFIG, character } }),
    );
    expect(parsePreset(saved).config.character).toEqual(character);
    expect(parsePreset(saved).config.foldShape).toBe(FOLD_CONFIG.foldShape);
  }
});

it.each([0.5, 1, 1.5])(
  'round-trips historical eye-spacing metadata %s',
  (eyeSpacing) => {
    const character = { preset: 'lime_frog', eyeSpacing };
    expect(
      parsePreset({ name: 'Todd', config: { ...FOLD_CONFIG, character } })
        .config.character,
    ).toEqual(character);
  },
);

it.each([0.49, 1.51, NaN, Infinity, -Infinity, '1', null])(
  'rejects invalid historical eye-spacing metadata %#',
  (eyeSpacing) => {
    expect(() =>
      parseCharacterConfig({ preset: 'lime_frog', eyeSpacing }),
    ).toThrow('Invalid character eye spacing');
  },
);

it('does not add historical eye-spacing metadata to new recipes', () => {
  expect(parseCharacterConfig({ preset: 'lime_frog' })).not.toHaveProperty(
    'eyeSpacing',
  );
});

it('round-trips an independent single-eye style without introducing a body or discarding paired spacing', () => {
  const character = {
    preset: 'lime_frog',
    selections: { eyes: 'cyclops', eyewear: 'monocle', accessory: 'crown' },
    eyeSpacing: 1.28,
  };
  const saved = JSON.parse(
    JSON.stringify({
      name: 'Single eye',
      config: { ...FOLD_CONFIG, character },
    }),
  );
  expect(parsePreset(saved).config.character).toEqual(character);
  expect(parsePreset(saved).config.character?.selections).not.toHaveProperty(
    'shape',
  );
});
