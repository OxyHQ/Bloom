import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  bloomDesignTokens,
  renderBloomTokensJson,
  resolvedColorToHex,
  type PresetGroup,
} from '../design-tokens/tokens-json';
import { APP_COLOR_NAMES, APP_COLOR_PRESETS } from '../theme/color-presets';
import { CANONICAL_TOKENS, getResolvedTokens } from '../theme/token-registry';

const TOKENS_PATH = join(__dirname, '..', 'design-tokens', 'tokens.json');

describe('the shipped tokens.json is generated, not maintained', () => {
  it('is byte-identical to a fresh render', () => {
    // The whole guarantee: a token changed in the engine and not regenerated
    // fails here rather than shipping a JSON that describes a palette Bloom no
    // longer paints.
    expect(readFileSync(TOKENS_PATH, 'utf8')).toBe(renderBloomTokensJson());
  });

  it('says so in its own $description', () => {
    expect(bloomDesignTokens().$description).toContain('AUTO-GENERATED');
  });
});

describe('tokens.json shape contract', () => {
  /* Astro codegens C++ SkColor tables from these paths, so the shape is a
   * published interface: new groups may be added, existing paths may not move. */
  const tokens = bloomDesignTokens();

  it('covers every preset Bloom ships, and nothing else', () => {
    const presets = Object.keys(tokens.color).filter((key) => !key.startsWith('$'));
    expect(presets.sort()).toEqual([...APP_COLOR_NAMES].sort());
  });

  it('carries both schemes and every canonical token, for every preset', () => {
    for (const name of APP_COLOR_NAMES) {
      const preset = tokens.color[name] as PresetGroup;
      for (const scheme of ['light', 'dark'] as const) {
        expect(Object.keys(preset[scheme]).sort()).toEqual([...CANONICAL_TOKENS].sort());
      }
    }
  });

  it('names tokens as the CSS custom property without the leading --', () => {
    // What makes the mapping mechanical for a consumer. A token renamed on one
    // side only would break it silently.
    const preset = tokens.color.oxy as PresetGroup;
    for (const token of Object.keys(preset.light)) {
      expect(token.startsWith('--')).toBe(false);
      expect(getResolvedTokens('oxy', 'light')[`--${token}`]).toBeDefined();
    }
  });

  it('resolves every colour to an sRGB hex string', () => {
    for (const name of APP_COLOR_NAMES) {
      const preset = tokens.color[name] as PresetGroup;
      for (const scheme of ['light', 'dark'] as const) {
        for (const [token, entry] of Object.entries(preset[scheme])) {
          expect(`${name}.${scheme}.${token} = ${String(entry.$value)}`).toMatch(
            /= #[0-9a-f]{6}([0-9a-f]{2})?$/,
          );
        }
      }
    }
  });

  it('records each preset’s seed and variant', () => {
    for (const name of APP_COLOR_NAMES) {
      const preset = tokens.color[name] as PresetGroup;
      expect(preset.$extensions['so.oxy.bloom']).toMatchObject({
        seed: APP_COLOR_PRESETS[name].hex,
        variant: APP_COLOR_PRESETS[name].variant,
      });
    }
  });

  it('emits the numeric scales as px dimensions', () => {
    expect(tokens.spacing['space-8']).toEqual({ $value: '8px' });
    expect(tokens.radius['radius-max']).toEqual({ $value: '9999px' });
    expect(tokens.borderWidth['hairline']).toEqual({ $value: '0.5px' });
    expect(tokens.typography['body']).toMatchObject({
      fontSize: { $value: '15px' },
      fontWeight: { $value: 400 },
    });
  });
});

describe('resolvedColorToHex', () => {
  it('converts the engine’s two output forms', () => {
    expect(resolvedColorToHex('rgb(255 239 253)')).toBe('#ffeffd');
    expect(resolvedColorToHex('rgb(0 0 0)')).toBe('#000000');
    // 0.13 × 255 = 33.15 → 33 → 0x21. An 8-bit alpha is exactly what an SkColor
    // holds, so nothing is lost downstream.
    expect(resolvedColorToHex('rgba(213, 86, 255, 0.13)')).toBe('#d556ff21');
  });

  it('drops a fully opaque alpha rather than emitting #rrggbbff', () => {
    expect(resolvedColorToHex('rgba(1, 2, 3, 1)')).toBe('#010203');
  });

  /* The engine emitting a third form — an oklch(), a bare hex, a named colour —
   * would otherwise reach a C++ colour table as an unparseable string. Failing
   * at generation time is the only place anyone would notice. */
  it('throws on anything that is not an rgb()/rgba() colour', () => {
    expect(() => resolvedColorToHex('oklch(0.7 0.1 300)')).toThrow(/not an rgb/);
    expect(() => resolvedColorToHex('#ffeffd')).toThrow(/not an rgb/);
    expect(() => resolvedColorToHex('0.5rem')).toThrow(/not an rgb/);
  });
});
