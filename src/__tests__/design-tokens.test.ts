import {
  bloomTailwindPreset,
  bloomThemeCss,
  bloomThemeBlock,
  FILL_ROLES,
  TEXT_ROLES,
  BORDER_ROLES,
  SPACING,
  RADIUS,
  BORDER_WIDTH,
  TYPOGRAPHY,
  FONT_FAMILY_VARS,
  SHADOW_BOX,
  bloomShadowStyle,
} from '../design-tokens';
import { CANONICAL_TOKENS } from '../theme/token-registry';

describe('design-tokens color roles', () => {
  const allRoles = { ...FILL_ROLES, ...TEXT_ROLES, ...BORDER_ROLES };

  it('every color role is a var(--canonical) reference (no hardcoded color)', () => {
    for (const [role, value] of Object.entries(allRoles)) {
      expect(value).toMatch(/^var\(--[a-z-]+\)$/);
      // Never wrap a base token in hsl() — bloom base tokens are full rgb colors.
      expect(value).not.toContain('hsl(');
    }
  });

  it('every color role aliases an existing canonical theme token', () => {
    for (const value of Object.values(allRoles)) {
      const token = value.replace(/^var\(--/, '').replace(/\)$/, '');
      expect(CANONICAL_TOKENS).toContain(token as never);
    }
  });
});

describe('design-tokens numeric scales', () => {
  it('exposes the spec spacing scale + screen-margin', () => {
    expect(SPACING).toMatchObject({
      'space-2': 2,
      'space-4': 4,
      'space-8': 8,
      'space-12': 12,
      'space-16': 16,
      'space-20': 20,
      'space-24': 24,
      'space-32': 32,
      'screen-margin': 20,
    });
  });

  it('exposes the spec radius scale', () => {
    expect(RADIUS).toMatchObject({
      'radius-8': 8,
      'radius-12': 12,
      'radius-20': 20,
      'radius-28': 28,
      'radius-max': 9999,
    });
  });

  it('exposes the 0.5px hairline border width', () => {
    expect(BORDER_WIDTH.hairline).toBe(0.5);
  });
});

describe('design-tokens typography', () => {
  it('covers every spec type role', () => {
    const names = Object.keys(TYPOGRAPHY).sort();
    expect(names).toEqual(
      [
        'body',
        'bodySmall',
        'bodyTitleSmall',
        'buttonLarge',
        'caption',
        'headerBold',
        'sectionTitle',
        'subtitle',
      ].sort(),
    );
  });

  it('each role has a valid size/lineHeight/weight/family', () => {
    for (const role of Object.values(TYPOGRAPHY)) {
      expect(role.size).toBeGreaterThan(0);
      expect(role.lineHeight).toBeGreaterThanOrEqual(role.size);
      expect(['400', '500', '600', '700']).toContain(role.weight);
      expect(FONT_FAMILY_VARS[role.family]).toBeDefined();
    }
  });
});

describe('design-tokens Tailwind preset', () => {
  const ext = bloomTailwindPreset.theme.extend;

  it('only extends theme (additive, no top-level theme override)', () => {
    expect(Object.keys(bloomTailwindPreset)).toEqual(['theme']);
    expect(Object.keys(bloomTailwindPreset.theme)).toEqual(['extend']);
  });

  it('color roles reach background/text/border buckets', () => {
    expect(ext.backgroundColor['fill']).toBe('var(--card)');
    expect(ext.textColor['text-tertiary']).toBe('var(--muted-foreground)');
    expect(ext.borderColor['border-input-active']).toBe('var(--ring)');
  });

  it('spacing/radius are emitted in px', () => {
    expect(ext.spacing['space-8']).toBe('8px');
    expect(ext.spacing['screen-margin']).toBe('20px');
    expect(ext.borderRadius['radius-20']).toBe('20px');
    expect(ext.borderWidth['hairline']).toBe('0.5px');
  });

  it('fontSize entries are [size, { lineHeight }] tuples', () => {
    expect(ext.fontSize['body']).toEqual(['15px', { lineHeight: '22px' }]);
    expect(ext.fontSize['headerBold']).toEqual(['28px', { lineHeight: '34px' }]);
  });

  it('fontFamily entries are [family, { fontWeight }] tuples', () => {
    expect(ext.fontFamily['body']).toEqual([
      'var(--bloom-font-sans)',
      { fontWeight: '400' },
    ]);
    expect(ext.fontFamily['headerBold']).toEqual([
      'var(--bloom-font-display)',
      { fontWeight: '700' },
    ]);
  });

  it('registers shadow-s and shadow-m box shadows', () => {
    expect(ext.boxShadow['s']).toBe(SHADOW_BOX.s);
    expect(ext.boxShadow['m']).toBe(SHADOW_BOX.m);
  });

  it('is frozen so consumer config merges cannot mutate it', () => {
    expect(Object.isFrozen(bloomTailwindPreset)).toBe(true);
  });
});

describe('design-tokens v4 @theme css', () => {
  const css = bloomThemeCss();

  it('emits --color-<role> aliases as direct var(--x) (never hsl-wrapped)', () => {
    expect(css).toContain('--color-fill: var(--card);');
    expect(css).toContain('--color-text-tertiary: var(--muted-foreground);');
    expect(css).not.toContain('hsl(var(');
  });

  it('emits spacing, radius, typography and shadow vars', () => {
    expect(css).toContain('--spacing-space-8: 8px;');
    expect(css).toContain('--radius-radius-20: 20px;');
    expect(css).toContain('--text-body: 15px;');
    expect(css).toContain('--text-body--line-height: 22px;');
    expect(css).toContain('--font-body: var(--bloom-font-sans);');
    expect(css).toContain('--shadow-s:');
  });

  it('wraps the body in a @theme block', () => {
    expect(bloomThemeBlock()).toMatch(/^@theme \{[\s\S]*\}$/);
  });
});

describe('design-tokens shadow style (web default)', () => {
  it('returns a boxShadow style on the web/default fork', () => {
    const style = bloomShadowStyle('m');
    expect(style).toHaveProperty('boxShadow', SHADOW_BOX.m);
  });
});
