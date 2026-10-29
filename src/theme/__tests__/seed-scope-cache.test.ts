/**
 * `buildSeedScopeVars` keeps what it solved for a seed: the second call for the
 * same options gives an EQUAL map without solving again, every call gets a map of
 * its own (mutating one never reaches the next), and each option takes part in
 * the key.
 */
import * as engine from '../color-engine';
import * as policy from '../color-policy';
import { buildSeedScopeVars } from '../color-scope/seed-scope';

describe('buildSeedScopeVars cache', () => {
  afterEach(() => jest.restoreAllMocks());

  it('solves a seed once and returns an equal, separate map each time', () => {
    const solve = jest.spyOn(policy, 'buildPolicyTokens');
    const options = { seed: '#3a7bd5', mode: 'dark' as const, contrastLevel: 0.25 };
    const first = buildSeedScopeVars(options);
    const second = buildSeedScopeVars({ ...options });
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(solve).toHaveBeenCalledTimes(1);

    first['--primary'] = 'rgb(1 2 3)';
    expect(buildSeedScopeVars(options)['--primary']).not.toBe('rgb(1 2 3)');
  });

  it('keys on every option', () => {
    const base = { seed: '#c2185b', mode: 'light' as const };
    const variants = [
      base,
      { ...base, mode: 'dark' as const },
      { ...base, seed: '#C2185B' },
      { ...base, variant: 'tonalSpot' as const },
      { ...base, contrastLevel: 1 },
      { ...base, secondarySeed: '#ffb300' },
      { ...base, tertiarySeed: '#00897b' },
    ];
    const solve = jest.spyOn(engine, 'generateRoleColors');
    for (const options of variants) buildSeedScopeVars(options);
    expect(solve).toHaveBeenCalledTimes(variants.length);
  });
});
