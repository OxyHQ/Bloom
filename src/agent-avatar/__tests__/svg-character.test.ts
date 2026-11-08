import {
  CHARACTER_PRESETS,
  CHARACTER_TEMPLATES,
  characterTemplateChoice,
} from '../../agent-creator/constants';
import {
  avatarCharacterOf,
  parseAvatarCharacter,
  resolveAvatarCharacter,
  updateAvatarCharacter,
} from '../character';
import { isSvgEyes, isSvgShape, SVG_SHAPES } from '../svg-catalog';

function template(id: string) {
  const character = CHARACTER_TEMPLATES[id];
  if (!character) throw new Error(`Missing character template: ${id}`);
  return character;
}

describe('vector character identity', () => {
  it('registers the thirteen distinct bodies without reusing legacy names', () => {
    expect(SVG_SHAPES).toEqual([
      'bot_blob',
      'bot_star',
      'bot_hex',
      'bot_heart',
      'bot_square',
      'bot_tablet',
      'bot_sparkle',
      'bot_flower',
      'bot_wedge',
      'bot_clover',
      'bot_teardrop',
      'bot_pebble',
      'bot_cloud',
    ]);
    expect(isSvgShape('heart')).toBe(false);
    expect(isSvgShape('bot_unknown')).toBe(false);
    expect(isSvgEyes('oval')).toBe(false);
    expect(isSvgEyes('bot')).toBe(true);
  });

  it.each(SVG_SHAPES)('saves and edits %s through the same character contract', (shape) => {
    const initial = template(shape);
    const saved = parseAvatarCharacter(JSON.parse(JSON.stringify(initial)));
    const resolved = resolveAvatarCharacter(saved);
    expect(resolved).toMatchObject({
      shape,
      eyes: 'bot',
      eyewear: 'none',
      accessory: 'none',
      authored: false,
    });
    expect(resolveAvatarCharacter(avatarCharacterOf(resolved))).toEqual(resolved);

    const edited = updateAvatarCharacter(saved, {
      eyes: 'cyclops',
      accessory: 'bow',
      eyeSpacing: 1.3,
      bodyColor: '#ABCDEF',
    });
    expect(parseAvatarCharacter(edited)).toMatchObject({
      shape,
      eyes: 'cyclops',
      accessory: 'bow',
      eyeSpacing: 1.3,
      bodyColor: '#abcdef',
    });
    expect(isSvgShape(resolveAvatarCharacter(edited).shape)).toBe(true);
  });

  it('keeps a vector face when changing to an existing body', () => {
    const edited = updateAvatarCharacter(template('bot_blob'), { shape: 'heart' });
    expect(resolveAvatarCharacter(edited)).toMatchObject({ shape: 'heart', eyes: 'bot' });
    expect(isSvgEyes(resolveAvatarCharacter(edited).eyes)).toBe(true);
  });

  it('preserves preset semantics when a vector part overrides it', () => {
    expect(resolveAvatarCharacter({ preset: 'blue_beret' }).authored).toBe(true);
    expect(resolveAvatarCharacter({ preset: 'blue_beret', shape: 'bot_blob' })).toMatchObject({
      preset: 'blue_beret',
      shape: 'bot_blob',
      authored: false,
    });
    expect(resolveAvatarCharacter({ preset: 'blue_beret', eyes: 'bot' }).authored).toBe(false);
    expect(() => parseAvatarCharacter({ preset: 'peri' })).toThrow('Unknown avatar preset');
    expect(() => parseAvatarCharacter({ preset: 'blue_beret', shape: 'bot_unknown' })).toThrow(
      'Unknown avatar shape',
    );
  });

  it('offers the approved twenty-three characters as complete creation choices', () => {
    expect(CHARACTER_PRESETS).toHaveLength(23);
    expect(new Set(CHARACTER_PRESETS.map(({ id }) => id)).size).toBe(23);
    expect(CHARACTER_TEMPLATES.peri).toEqual({ preset: 'blue_beret' });
    for (const { id } of CHARACTER_PRESETS) {
      const character = template(id);
      expect(parseAvatarCharacter(character)).toBeDefined();
      expect(characterTemplateChoice(character)).toBe(id);
    }
  });
});
