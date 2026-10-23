/**
 * `getPresetVars` solves each preset/mode/accent set once.
 *
 * A set is two solves (the M3 roles, then the policy layer) and
 * `BloomThemeProvider` asks for the same set twice on one render, so the result
 * is cached. These tests pin both halves of
 * that contract: the solve runs once per distinct input, and every caller still
 * gets its own object, so a caller that edits what it was handed cannot change
 * what the next one reads.
 */
const policySpy = jest.fn();

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

import { getPresetVars } from '../preset-vars';

beforeEach(() => policySpy.mockClear());

it('solves a preset and mode once, however often it is asked', () => {
  const first = getPresetVars('blue', 'light');
  const second = getPresetVars('blue', 'light');
  expect(second).toEqual(first);
  expect(policySpy).toHaveBeenCalledTimes(1);
});

it('keys on the mode and on each pinned accent', () => {
  const light = getPresetVars('green', 'light');
  const dark = getPresetVars('green', 'dark');
  const pinnedSecondary = getPresetVars('green', 'light', { secondaryHex: '#ffc300' });
  const pinnedTertiary = getPresetVars('green', 'light', { tertiaryHex: '#ffc300' });
  expect(policySpy).toHaveBeenCalledTimes(4);
  expect(dark['--background']).not.toBe(light['--background']);
  expect(pinnedSecondary['--secondary']).not.toBe(light['--secondary']);
  expect(pinnedTertiary['--tertiary']).not.toBe(light['--tertiary']);
  expect(pinnedTertiary['--secondary']).toBe(light['--secondary']);
});

it('hands every caller its own object', () => {
  const first = getPresetVars('teal', 'dark');
  const original = first['--primary'];
  first['--primary'] = 'rgb(1 2 3)';
  const second = getPresetVars('teal', 'dark');
  expect(second).not.toBe(first);
  expect(second['--primary']).toBe(original);
});
