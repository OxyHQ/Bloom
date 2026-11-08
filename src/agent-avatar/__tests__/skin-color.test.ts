import { AVATAR_PRESETS, AVATAR_SHAPES } from '../catalog-ids';
import { argbFromHex, lstarFromArgb } from '../../theme/color-engine/color-utils';
import { CHARACTER_COLORS } from '../character-colors';
import {
  avatarBodyHex,
  avatarCharacterOf,
  parseAvatarCharacter,
  resolveAvatarCharacter,
  updateAvatarCharacter,
} from '../character';
import { AVATAR_SKIN_MIN_TONE, normalizeAvatarSkinColor } from '../skin-color';

it('bounds perceptual lightness, including saturated blue, and is idempotent', () => {
  for (let r = 0; r <= 255; r += 17)
    for (let g = 0; g <= 255; g += 17)
      for (let b = 0; b <= 255; b += 17) {
        const source = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
        const result = normalizeAvatarSkinColor(source);
        expect(lstarFromArgb(argbFromHex(result))).toBeGreaterThanOrEqual(AVATAR_SKIN_MIN_TONE);
        expect(normalizeAvatarSkinColor(result)).toBe(result);
        if (lstarFromArgb(argbFromHex(source)) >= AVATAR_SKIN_MIN_TONE) expect(result).toBe(source);
      }
});
it('preserves every named palette color and allowed RGB byte-for-byte', () => {
  for (const source of [...Object.values(CHARACTER_COLORS), '#777777', '#ff0000', '#ffffff'])
    expect(normalizeAvatarSkinColor(source)).toBe(source);
});
it('normalizes saved, edited, and resolved skin without changing parts or named paint', () => {
  const input = { preset: 'blue_beret' as const, bodyColor: '#001144' };
  const expected = normalizeAvatarSkinColor(input.bodyColor);
  expect(parseAvatarCharacter(input).bodyColor).toBe(expected);
  expect(
    updateAvatarCharacter({ preset: 'blue_beret' }, { bodyColor: input.bodyColor }).bodyColor,
  ).toBe(expected);
  const resolved = resolveAvatarCharacter(input);
  expect(avatarBodyHex(resolved)).toBe(expected);
  expect(resolveAvatarCharacter(avatarCharacterOf(resolved))).toEqual(resolved);
  expect(resolved.eyes).toBe(resolveAvatarCharacter({ preset: 'blue_beret' }).eyes);
  expect(resolved.accessory).toBe(resolveAvatarCharacter({ preset: 'blue_beret' }).accessory);
  expect(input.bodyColor).toBe('#001144');
  expect(resolveAvatarCharacter({ preset: 'blue_beret', color: 'blue' }).paint).toEqual({
    color: 'blue',
  });
});

it('applies the same floor to every preset and shape without changing their parts', () => {
  for (const preset of AVATAR_PRESETS) {
    const resolved = resolveAvatarCharacter({ preset });
    expect(lstarFromArgb(argbFromHex(avatarBodyHex(resolved)))).toBeGreaterThanOrEqual(
      AVATAR_SKIN_MIN_TONE,
    );
  }
  for (const shape of AVATAR_SHAPES) {
    const resolved = resolveAvatarCharacter({
      shape,
      eyes: 'oval',
      eyewear: 'classic_sunglasses',
      accessory: 'bow',
      bodyColor: '#000000',
    });
    expect(avatarBodyHex(resolved)).toBe(normalizeAvatarSkinColor('#000000'));
    expect([resolved.shape, resolved.eyes, resolved.eyewear, resolved.accessory]).toEqual([
      shape,
      'oval',
      'classic_sunglasses',
      'bow',
    ]);
  }
});
