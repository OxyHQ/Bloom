import { CANONICAL_TOKENS, getResolvedTokens } from '../token-registry';
import { APP_COLOR_NAMES } from '../color-presets';
import { getPresetVars } from '../preset-vars';
import { parseRgbString, deltaE } from '../color-space';

it('canonical token list covers every base+extended preset var', () => {
  const fromPreset = Object.keys(getPresetVars('oxy', 'light'));
  for (const k of fromPreset) expect(CANONICAL_TOKENS).toContain(k.replace(/^--/, ''));
});

describe('getResolvedTokens parity vs golden oracle (exact, ΔE ≤ 1)', () => {
  for (const name of APP_COLOR_NAMES) {
    for (const mode of ['light', 'dark'] as const) {
      it(`${name}/${mode}`, () => {
        const oracle = getPresetVars(name, mode, { includeResolvedColorVars: true });
        const resolved = getResolvedTokens(name, mode); // Record<'--x','rgb(...)'>
        for (const [k, oracleRgb] of Object.entries(oracle)) {
          if (!k.startsWith('--color-')) continue;
          const base = k.replace('--color-', '--');
          expect(resolved[base]).toBeDefined();
          expect(deltaE(parseRgbString(resolved[base]!), parseRgbString(oracleRgb))).toBeLessThanOrEqual(1.0);
        }
      });
    }
  }
});
