import { avatarHex } from '../avatar-color';
import { CHARACTER_COLORS } from '../character-colors';
import {
  CHARACTER_SHAPES,
  createConfigForShape,
  materializeCharacter,
} from '../character-shapes';
import { legacyCharacterRecipe, legacyRecipe } from '../legacy-recipe';
import { FOLD_CONFIG, type AvatarConfig } from '../model';

const customized = (extra = {}): AvatarConfig => ({
  ...FOLD_CONFIG,
  character: {
    preset: 'lime_frog',
    eyeSpacing: 1.27,
    selections: {
      eyes: 'sleepy_lids',
      eyewear: 'monocle',
      accessory: 'felipe_beret',
      color: 'blue',
    },
    ...extra,
  },
});

describe('one character across all body shapes', () => {
  it('preserves the complete recipe across all 441 ordered body transitions, in either palette mode', () => {
    for (const paint of [{}, { bodyColor: '#123456' }]) {
      const original = customized(paint);
      const before = JSON.stringify(original);
      for (const [from] of CHARACTER_SHAPES)
        for (const [to] of CHARACTER_SHAPES) {
          const first = createConfigForShape(original, from);
          const second = createConfigForShape(first, to);
          expect(second.character).toEqual({
            ...original.character,
            selections: { ...original.character!.selections, shape: to },
          });
          expect(legacyCharacterRecipe(second)).toBe(second.character);
        }
      expect(JSON.stringify(original)).toBe(before);
    }
  });

  it('promotes old paper recipes once with original RGB, spacing and explicit parts, then preserves them across every body', () => {
    const old: AvatarConfig = {
      ...FOLD_CONFIG,
      foldShape: 'cloud',
      foldDirection: 'left',
      character: {
        preset: 'bloom',
        eyeSpacing: 0.82,
        selections: { eyes: 'dots', eyewear: 'none', accessory: 'crown' },
      },
    };
    const contour = legacyRecipe(old).points;
    for (const [id] of CHARACTER_SHAPES) {
      const changed = createConfigForShape(old, id);
      expect(changed.character).toEqual({
        preset: 'legacy',
        bodyColor: avatarHex(old),
        eyeSpacing: 0.82,
        selections: {
          shape: id,
          eyes: 'dots',
          eyewear: 'none',
          accessory: 'crown',
        },
      });
      const returned = createConfigForShape(changed, 'cloud');
      expect(legacyRecipe(returned).points).toEqual(contour);
    }
  });

  it('retains named paint when promoting a saved Bloom customization', () => {
    const old = {
      ...FOLD_CONFIG,
      character: {
        preset: 'bloom',
        selections: { color: 'blue', eyes: 'cyclops' },
      },
    };
    expect(legacyCharacterRecipe(old).bodyColor).toBe(CHARACTER_COLORS.blue);
    for (const [shape] of CHARACTER_SHAPES) {
      const next = createConfigForShape(old, shape);
      expect(next.character!.selections!.color).toBe('blue');
      expect(next.character).not.toHaveProperty('bodyColor');
    }
  });

  it.each([
    [{ color: 'blue' }, { selections: { color: 'blue' } }],
    [{ bodyColor: '#f0bd73' }, { bodyColor: '#f0bd73' }],
  ])(
    'copies actual resolved default paint to every body without replacing its preset %#',
    (selected, expected) => {
      const original = { ...FOLD_CONFIG, character: { preset: 'gus' } };
      for (const [shape] of CHARACTER_SHAPES) {
        const next = createConfigForShape(original, shape, selected);
        expect(next.character).toMatchObject({ preset: 'gus', ...expected });
      }
    },
  );

  it('keeps explicit RGB ahead of named/default paint and keeps a preset unchanged when metadata is still pending', () => {
    const original = customized({ bodyColor: '#123456' });
    expect(
      createConfigForShape(original, 'todd', {
        color: 'lime',
        bodyColor: '#abcdef',
      }).character!.bodyColor,
    ).toBe('#123456');
    const pending = { ...FOLD_CONFIG, character: { preset: 'alfred' } };
    expect(createConfigForShape(pending, 'cloud').character).toEqual({
      preset: 'alfred',
      selections: { shape: 'cloud' },
    });
    expect(materializeCharacter(pending)).not.toHaveProperty('bodyColor');
  });

  it('never imports Clippo backing blue when changing body before capabilities are ready', () => {
    for (const [shape] of CHARACTER_SHAPES) {
      const next = createConfigForShape(
        { ...FOLD_CONFIG, character: { preset: 'clippo' } },
        shape,
        { color: 'blue' },
      );
      expect(next.character).toMatchObject({
        preset: 'clippo',
        bodyColor: '#999b9d',
        selections: { eyes: 'clippo', shape },
      });
    }
  });
});
