import { parseCharacterConfig } from '../config-character';
import { FOLD_CONFIG, parsePreset } from '../model';

it('round-trips optional character selections without changing the procedural fallback', () => {
  const character = {
    preset: 'blue_beret',
    selections: { shape: 'heart', eyes: 'oval' },
    bodyColor: '#03afbc',
  };
  const saved = parsePreset(JSON.parse(JSON.stringify({ name: 'Saved', config: { ...FOLD_CONFIG, character } })));
  expect(saved.config).toEqual({ ...FOLD_CONFIG, character });
  expect(saved.config.character).not.toBe(character);
  expect(parsePreset({ name: 'Current', config: FOLD_CONFIG }).config.character).toBeUndefined();
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
  expect(() => parsePreset({ name: 'Invalid', config: { ...FOLD_CONFIG, character } })).toThrow();
});


it('canonicalizes custom RGB while preserving all legacy recipe settings', () => {
  const input = { ...FOLD_CONFIG, lookAt: 'top-left' as const, foldShape: 'shield' as const, character: { preset: 'blue_beret', bodyColor: '#Aa00Ff', selections: { accessory: 'bow' } } };
  expect(parsePreset({ name: 'Custom', config: input }).config).toEqual({ ...input, character: { ...input.character, bodyColor: '#aa00ff' } });
  expect(input.character.bodyColor).toBe('#Aa00Ff');
  expect(parseCharacterConfig({ preset: 'blue_beret' })).not.toHaveProperty('bodyColor');
});

it.each(['#abc', '#12345678', 'abcdef', ' #abcdef', '#abcdef\n', '#gg0000', '', null, 0])('rejects invalid custom RGB %#', (bodyColor) => {
  expect(() => parseCharacterConfig({ preset: 'blue_beret', bodyColor })).toThrow('Invalid character body color');
});
