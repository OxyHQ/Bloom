import goldenResolvedTokens from './__fixtures__/golden-resolved-tokens.json';
import { APP_COLOR_NAMES } from '../color-presets';
import { getResolvedTokens } from '../token-registry';

// `golden-resolved-tokens.json` is the FROZEN parity oracle: the exact resolved
// rgb for every preset×mode×token that the legacy resolved-color pipeline
// produced (captured once, each resolved-color key remapped to its base `--X`).
// It is IMMUTABLE — never regenerate it to chase new output. These tests prove
// the canonical `getResolvedTokens` pipeline reproduces that palette EXACTLY
// (byte-for-byte rgb), so the refactor to a single rgb token pipeline does not
// shift a single color.
const fixture = goldenResolvedTokens as Record<string, Record<string, string>>;

describe('golden token parity (frozen oracle)', () => {
  for (const name of APP_COLOR_NAMES) {
    for (const mode of ['light', 'dark'] as const) {
      it(`${name}/${mode} resolves to the frozen rgb palette exactly`, () => {
        const expected = fixture[`${name}/${mode}`];
        expect(expected).toBeDefined();

        const resolved = getResolvedTokens(name, mode);
        // For every token the oracle ever resolved, the canonical pipeline must
        // produce the identical rgb string. (The fixture covers exactly the keys
        // that had a resolved-color companion; extended-only tokens —
        // chart-*/sidebar-*/content-area — were never in the rgb oracle and are
        // covered by the canonical-token coverage test instead.)
        const actual: Record<string, string | undefined> = {};
        for (const key of Object.keys(expected ?? {})) actual[key] = resolved[key];
        expect(actual).toEqual(expected);
      });
    }
  }
});
