import { tokens } from '@oxy.so/bloom/styles';
import { TYPE_SCALE } from '@oxy.so/bloom/typography';
import {
  defineTokens,
  resolveCorner,
  resolveFont,
  resolveIconSize,
  resolveAvatarSize,
  resolveSpace,
} from '../tokens';

describe('tokens resolve to Bloom’s rungs', () => {
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
      fontFamily: 'Inter',
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

  it('text draws in Bloom Text’s face: the display face for the title families, its bold cut above 500', () => {
    expect(resolveFont('title-1', 'regular', undefined).fontFamily).toBe('BlomusModernus');
    expect(resolveFont('title-1', 'semibold', undefined).fontFamily).toBe('BlomusModernus-Bold');
    expect(resolveFont('large-title', 'medium', undefined).fontFamily).toBe('BlomusModernus');
    expect(resolveFont('headline', 'bold', undefined).fontFamily).toBe('Inter');
    expect(resolveFont(undefined, undefined, undefined).fontFamily).toBe('Inter');
  });

  it('icon and avatar rungs resolve by name', () => {
    expect(resolveIconSize('md')).toBe(20);
    expect(resolveAvatarSize('lg')).toBe(36);
  });

  it('a size rung sets the size, and the weight and leading only when given', () => {
    expect(resolveFont('md', undefined, undefined)).toEqual({
      fontFamily: 'Inter',
      fontSize: tokens.fontSize.md,
    });
    expect(resolveFont('sm', 'semibold', undefined)).toEqual({
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
    });
    expect(resolveFont('md', undefined, 'snug')).toEqual({
      fontFamily: 'Inter',
      fontSize: 15,
      lineHeight: 15 * tokens.lineHeight.snug,
    });
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
