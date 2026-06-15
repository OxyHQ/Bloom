import goldenResolvedTokens from './__fixtures__/golden-resolved-tokens.json';
import { CANONICAL_TOKENS, getResolvedTokens } from '../token-registry';
import { APP_COLOR_NAMES } from '../color-presets';
import { getPresetVars } from '../preset-vars';

const fixture = goldenResolvedTokens as Record<string, Record<string, string>>;

it('canonical token list covers every base+extended preset var', () => {
  const fromPreset = Object.keys(getPresetVars('oxy', 'light'));
  for (const k of fromPreset) expect(CANONICAL_TOKENS).toContain(k.replace(/^--/, ''));
});

describe('getResolvedTokens parity vs frozen oracle (exact rgb)', () => {
  for (const name of APP_COLOR_NAMES) {
    for (const mode of ['light', 'dark'] as const) {
      it(`${name}/${mode}`, () => {
        const oracle = fixture[`${name}/${mode}`];
        expect(oracle).toBeDefined();

        const resolved = getResolvedTokens(name, mode); // Record<'--x','rgb(...)'>
        for (const [base, oracleRgb] of Object.entries(oracle ?? {})) {
          expect(resolved[base]).toBeDefined();
          // Exact match — the canonical pipeline reproduces the legacy
          // resolved-color rgb byte-for-byte, so there is no palette drift.
          expect(resolved[base]).toBe(oracleRgb);
        }
      });
    }
  }
});
