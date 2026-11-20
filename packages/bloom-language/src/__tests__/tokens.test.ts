import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { tokens } from '@oxy.so/bloom/styles';
import { TYPE_SCALE } from '@oxy.so/bloom/typography';
import {
  defineTokens,
  resolveCorner,
  resolveFont,
  resolveIconSize,
  resolveAvatarSize,
  resolveSpace,
  COLOR_ROLES,
} from '../tokens';

const BLOOM_SRC = join(__dirname, '../../../../src');

describe('tokens are Bloom’s scales, by reference', () => {
  it('spaces and corners read Bloom’s rungs', () => {
    expect(resolveSpace('xs')).toBe(tokens.space.xs);
    expect(resolveSpace('md')).toBe(tokens.space.md);
    expect(resolveSpace('2xl')).toBe(tokens.space._2xl);
    expect(resolveSpace('-lg')).toBe(-tokens.space.lg);
    expect(resolveCorner('lg')).toBe(tokens.borderRadius.lg);
    expect(resolveCorner('full')).toBe(tokens.borderRadius.full);
  });

  it('a ramp step is Bloom Text’s variant style, exactly', () => {
    const step = TYPE_SCALE['headline-semibold'];
    expect(resolveFont('headline', 'semibold', undefined)).toEqual({
      fontSize: step.fontSize,
      lineHeight: step.lineHeight,
      letterSpacing: step.letterSpacing,
      fontWeight: step.fontWeight,
    });
    // The ramp's line height can depend on the weight: the pair is looked up together.
    expect(resolveFont('title-3', 'medium', undefined).lineHeight).toBe(
      TYPE_SCALE['title-3-medium'].lineHeight,
    );
  });

  it('a size rung sets the size, and the weight and leading only when given', () => {
    expect(resolveFont('md', undefined, undefined)).toEqual({ fontSize: tokens.fontSize.md });
    expect(resolveFont('sm', 'semibold', undefined)).toEqual({ fontSize: 13, fontWeight: '600' });
    expect(resolveFont('md', undefined, 'snug')).toEqual({
      fontSize: 15,
      lineHeight: 15 * tokens.lineHeight.snug,
    });
  });

  it('icon and avatar rungs match Bloom’s own tables', () => {
    const icons = readFileSync(join(BLOOM_SRC, 'icons/shared.tsx'), 'utf8');
    for (const [name, size] of Object.entries({
      '2xs': 8,
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 28,
    })) {
      expect(icons).toMatch(new RegExp(`'?${name}'?: ${size},`));
      expect(resolveIconSize(name as 'md')).toBe(size);
    }
    const avatars = readFileSync(join(BLOOM_SRC, 'avatar/initials.ts'), 'utf8');
    for (const [name, size] of Object.entries({ xs: 20, sm: 24, md: 32, lg: 36 })) {
      expect(avatars).toMatch(new RegExp(`${name}: ${size},`));
      expect(resolveAvatarSize(name as 'md')).toBe(size);
    }
  });

  it('colour roles name theme colours, never values', () => {
    expect(COLOR_ROLES.muted).toBe('textSecondary');
    expect(COLOR_ROLES.foreground).toBe('text');
    expect(COLOR_ROLES.border).toBe('border');
    expect(COLOR_ROLES.surface).toBe('backgroundSecondary');
  });
});

describe('app tokens', () => {
  it('are named values with their own cache keys', () => {
    const a = defineTokens({
      space: { gutter: 64 },
      iconSize: { context: 13 },
      leading: { tight: 1.25 },
    });
    const b = defineTokens({ space: { gutter: 64 } });
    expect(resolveSpace(a.space.gutter)).toBe(64);
    expect(resolveIconSize(a.iconSize.context)).toBe(13);
    expect(resolveFont('md', undefined, a.leading.tight).lineHeight).toBe(18.75);
    expect(a.space.gutter.key).not.toBe(b.space.gutter.key);
    expect(Object.isFrozen(a.space.gutter)).toBe(true);
  });
});
