import { argbFromHex } from '../color-engine';
import { Hct } from '../color-engine/hct';
import { deriveAccentHues } from '../color-policy';
import { COLOR_PRESET_REGISTRY } from '../color-presets';
import { PRESET_ACCENT_HUES } from '../preset-accent-hues';

/**
 * The checked-in accent hues are a cache of `deriveAccentHues`, never a second
 * source: every preset seed is in the table with what the search computes, and
 * nothing else is. Fix a failure with `bun run generate:preset-accent-hues`.
 *
 * Agreement is to 1e-9 degrees, not bit for bit: JS engines round `Math`'s
 * transcendentals differently in the last place (the generator runs on Bun,
 * Jest on V8, devices on Hermes), which moves a hue by ~1e-13 — far below a
 * quantized colour. A real drift — a new seed, a changed search — moves one by
 * whole degrees.
 */
it('equals the accent search for every preset seed', () => {
  const seeds = [...new Set(COLOR_PRESET_REGISTRY.map(({ hex }) => hex.toLowerCase()))];
  expect(Object.keys(PRESET_ACCENT_HUES).sort()).toEqual([...seeds].sort());
  for (const [hex, table] of Object.entries(PRESET_ACCENT_HUES)) {
    const expected = deriveAccentHues(Hct.fromInt(argbFromHex(hex)).hue);
    expect(table.secondary).toBeCloseTo(expected.secondary, 9);
    expect(table.tertiary).toBeCloseTo(expected.tertiary, 9);
  }
});
