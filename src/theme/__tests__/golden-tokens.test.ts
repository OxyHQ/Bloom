import goldenResolvedTokens from './__fixtures__/golden-resolved-tokens.json';
import { APP_COLOR_NAMES } from '../color-presets';
import { getResolvedTokens } from '../token-registry';

// `golden-resolved-tokens.json` is the frozen palette oracle: the exact resolved
// rgb for every preset×mode×token. It was DELIBERATELY REBASED when the palette
// moved from hand-authored HSL triples to the colour engine (Phase 5) — the
// palette change is the deliverable. It is frozen going FORWARD: it now guards
// against accidental drift of the engine-backed output, so these tests still
// prove `getResolvedTokens` reproduces the committed palette byte-for-byte.
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
