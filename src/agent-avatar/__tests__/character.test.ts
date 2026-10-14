import {
  type AvatarCharacter,
  avatarCharacterOf,
  parseAvatarCharacter,
  resolveAvatarCharacter,
  updateAvatarCharacter,
} from '../character';
import { characterFromLegacy } from '../legacy-character';

describe('resolveAvatarCharacter', () => {
  it('fills every part and the paint from a preset', () => {
    expect(resolveAvatarCharacter({ preset: 'blue_beret' })).toEqual({
      preset: 'blue_beret',
      shape: 'six_lobed_flower',
      eyes: 'oval',
      eyewear: 'none',
      accessory: 'felipe_beret',
      paint: { color: 'blue' },
      authored: true,
    });
  });

  it('lets any part or paint override the preset, and names a paint exactly once', () => {
    const resolved = resolveAvatarCharacter({
      preset: 'blue_beret',
      accessory: 'none',
      color: 'orchid',
      bodyColor: '#AABBCC',
    });
    expect(resolved).toMatchObject({ accessory: 'none', paint: { bodyColor: '#aabbcc' } });
    expect(resolved.paint).not.toHaveProperty('color');
  });

  it('takes a preset whose paint is an exact color', () => {
    expect(resolveAvatarCharacter({ preset: 'gus' }).paint).toEqual({ bodyColor: '#ffd838' });
  });

  it('needs all four parts and a paint without a preset', () => {
    expect(() => resolveAvatarCharacter({ shape: 'heart' })).toThrow('needs its eyes');
    expect(() =>
      resolveAvatarCharacter({
        shape: 'heart',
        eyes: 'oval',
        eyewear: 'none',
        accessory: 'none',
      }),
    ).toThrow('needs a color or a bodyColor');
  });

  it('refuses what the renderer cannot draw', () => {
    expect(() => resolveAvatarCharacter({ preset: 'nope' as never })).toThrow(
      'Unknown avatar preset',
    );
    expect(() => resolveAvatarCharacter({ preset: 'blue_beret', shape: 'blob' as never })).toThrow(
      'Unknown avatar shape',
    );
    expect(() => resolveAvatarCharacter({ preset: 'blue_beret', bodyColor: 'red' })).toThrow(
      'Invalid avatar body color',
    );
    expect(() => resolveAvatarCharacter({ preset: 'blue_beret', eyeSpacing: 2 })).toThrow(
      'Invalid avatar eye spacing',
    );
  });
});

describe('which animation plays', () => {
  const authored = (character: AvatarCharacter) => resolveAvatarCharacter(character).authored;

  it('is the preset own while the character is exactly the preset, paint aside', () => {
    expect(authored({ preset: 'blue_beret' })).toBe(true);
    expect(authored({ preset: 'blue_beret', color: 'orchid' })).toBe(true);
    expect(authored({ preset: 'blue_beret', bodyColor: '#123456' })).toBe(true);
  });

  it('does not depend on whether the parts were written out', () => {
    expect(
      authored({
        preset: 'blue_beret',
        shape: 'six_lobed_flower',
        eyes: 'oval',
        eyewear: 'none',
        accessory: 'felipe_beret',
      }),
    ).toBe(true);
  });

  it.each<[string, AvatarCharacter]>([
    ['a part changed', { preset: 'blue_beret', accessory: 'none' }],
    ['a body changed', { preset: 'blue_beret', shape: 'cloud' }],
    ['the eye spacing set', { preset: 'blue_beret', eyeSpacing: 1 }],
    ['the face hidden', { preset: 'blue_beret', eyes: 'none' }],
    [
      'no preset at all',
      { shape: 'heart', eyes: 'oval', eyewear: 'none', accessory: 'none', color: 'pink' },
    ],
    ['the wire preset', { preset: 'clippo' }],
  ])('is retargeted with %s', (_name, character) => {
    expect(authored(character)).toBe(false);
  });
});

describe('parseAvatarCharacter', () => {
  it('returns the character, lower-casing the color', () => {
    expect(parseAvatarCharacter({ preset: 'alfred', bodyColor: '#FFAA00' })).toEqual({
      preset: 'alfred',
      bodyColor: '#ffaa00',
    });
  });

  it('refuses anything that is not a flat character', () => {
    expect(() => parseAvatarCharacter(null)).toThrow('Invalid avatar character');
    expect(() => parseAvatarCharacter([])).toThrow('Invalid avatar character');
    expect(() => parseAvatarCharacter({ preset: 'alfred', selections: { color: 'blue' } })).toThrow(
      'Unsupported avatar character field: selections',
    );
    expect(() => parseAvatarCharacter({ preset: 'alfred', state: {} })).toThrow('state');
  });
});

describe('updateAvatarCharacter', () => {
  it('keeps the rest the preset supplied, writing the edited character out in full', () => {
    expect(updateAvatarCharacter({ preset: 'blue_beret' }, { shape: 'heart' })).toEqual({
      preset: 'blue_beret',
      shape: 'heart',
      eyes: 'oval',
      eyewear: 'none',
      accessory: 'felipe_beret',
      color: 'blue',
    });
  });

  it('swaps one paint spelling for the other, never holding both', () => {
    const named = updateAvatarCharacter({ preset: 'blue_beret' }, { color: 'coral' });
    expect(named).toMatchObject({ color: 'coral' });
    const exact = updateAvatarCharacter(named, { bodyColor: '#010203' });
    expect(exact).toMatchObject({ bodyColor: '#010203' });
    expect(exact).not.toHaveProperty('color');
    const back = updateAvatarCharacter(exact, { color: 'lime' });
    expect(back).toMatchObject({ color: 'lime' });
    expect(back).not.toHaveProperty('bodyColor');
  });

  it('round-trips through resolve', () => {
    const resolved = resolveAvatarCharacter({ preset: 'alfred', color: 'coral' });
    expect(resolveAvatarCharacter(avatarCharacterOf(resolved))).toEqual({
      ...resolved,
      authored: true,
    });
  });
});

describe('characterFromLegacy', () => {
  const procedural = {
    family: 'fold',
    foldShape: 'cloud',
    shape: 'pebble',
    face: true,
    hue: 0,
    saturation: 100,
    lightness: 50,
  };

  it('makes the old silhouette the catalog body of the same name, and the hsl the exact color', () => {
    expect(characterFromLegacy(procedural)).toEqual({
      shape: 'cloud',
      eyes: 'oval',
      eyewear: 'none',
      accessory: 'none',
      bodyColor: '#ff0000',
    });
  });

  it('maps the paper names that the catalog spells differently', () => {
    expect(characterFromLegacy({ ...procedural, family: 'blob', shape: 'flower' })).toMatchObject({
      shape: 'six_lobed_flower',
    });
    expect(characterFromLegacy({ ...procedural, foldShape: 'diamond' })).toMatchObject({
      shape: 'rounded_diamond',
    });
  });

  it('hides the face with face: false and never keeps alien eyes', () => {
    expect(characterFromLegacy({ ...procedural, face: false })).toMatchObject({ eyes: 'none' });
    expect(
      characterFromLegacy({
        ...procedural,
        character: { preset: 'bloom', selections: { eyes: 'alien', color: 'teal' } },
      }),
    ).toMatchObject({ eyes: 'oval', bodyColor: '#04bb9f' });
  });

  it('flattens a catalog character that was written with selections', () => {
    expect(
      characterFromLegacy({
        ...procedural,
        character: {
          preset: 'blue_beret',
          selections: { color: 'blue', eyes: 'todd' },
          eyeSpacing: 1.2,
        },
      }),
    ).toEqual({ preset: 'blue_beret', color: 'blue', eyes: 'todd', eyeSpacing: 1.2 });
    expect(
      characterFromLegacy({
        ...procedural,
        character: {
          preset: 'legacy',
          selections: { shape: 'circle', eyes: 'oval', eyewear: 'none', accessory: 'bow' },
          bodyColor: '#112233',
        },
      }),
    ).toEqual({
      shape: 'circle',
      eyes: 'oval',
      eyewear: 'none',
      accessory: 'bow',
      bodyColor: '#112233',
    });
  });

  it('refuses what is not an avatar', () => {
    expect(() => characterFromLegacy(undefined)).toThrow('Invalid saved avatar');
  });
});
