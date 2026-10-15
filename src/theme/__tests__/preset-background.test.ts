/**
 * `getPresetBackground` is `getPresetVars(...)['--background']` without the set.
 *
 * A boot splash paints before the theme resolves and needs one colour, often
 * for the mode the device is not in, so it must not pay for the whole token
 * set (~50 ms on a 4x-throttled mobile profile, before the first paint). These
 * tests pin both halves: the value is the one the full set carries, for every
 * preset in both modes (authored and derived), and resolving it solves neither
 * the M3 roles nor the policy layer.
 */
const policySpy = jest.fn();
const rolesSpy = jest.fn();

jest.mock('../color-policy', () => {
  const actual = jest.requireActual('../color-policy');
  return {
    ...actual,
    buildPolicyTokens: (...args: unknown[]) => {
      policySpy(...args);
      return actual.buildPolicyTokens(...args);
    },
  };
});

jest.mock('../color-engine', () => {
  const actual = jest.requireActual('../color-engine');
  return {
    ...actual,
    generateRoleColors: (...args: unknown[]) => {
      rolesSpy(...args);
      return actual.generateRoleColors(...args);
    },
  };
});

import { APP_COLOR_NAMES } from '../color-presets';
import { getPresetBackground, getPresetVars } from '../preset-vars';

beforeEach(() => {
  policySpy.mockClear();
  rolesSpy.mockClear();
});

describe.each(['light', 'dark'] as const)('%s mode', (mode) => {
  it.each(APP_COLOR_NAMES.map((name) => [name]))(
    '%s matches the full set’s --background',
    (name) => {
      expect(getPresetBackground(name, mode)).toBe(getPresetVars(name, mode)['--background']);
    },
  );
});

it('solves neither the roles nor the policy', () => {
  for (const name of APP_COLOR_NAMES) {
    getPresetBackground(name, 'light');
    getPresetBackground(name, 'dark');
  }
  expect(rolesSpy).not.toHaveBeenCalled();
  expect(policySpy).not.toHaveBeenCalled();
});

it('covers an authored background as well as a derived one', () => {
  // `oxy` authors its page colour; `blue` derives it. Both paths must be exercised.
  expect(getPresetBackground('oxy', 'dark')).toBe('rgb(31 3 29)');
  expect(getPresetBackground('blue', 'dark')).toMatch(/^rgb\(\d+ \d+ \d+\)$/);
});
