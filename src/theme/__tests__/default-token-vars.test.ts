import { CANONICAL_TOKENS } from '../canonical-tokens';
import { buildScopeVars } from '../color-scope/style-builder';
import { DEFAULT_TOKEN_VARS } from '../default-token-vars';

/**
 * The checked-in default palette is a cache of the engine, never a second
 * source: every canonical token is in the table with the value
 * `buildScopeVars('oxy', 'light')` resolves, and nothing else is. Fix a failure
 * with `bun run generate:default-token-vars`.
 */
it("equals buildScopeVars('oxy', 'light') for every canonical token", () => {
  const vars = buildScopeVars('oxy', 'light');
  expect(DEFAULT_TOKEN_VARS).toEqual(
    Object.fromEntries(CANONICAL_TOKENS.map((name) => [`--${name}`, vars[`--${name}`]])),
  );
});
