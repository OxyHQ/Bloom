/**
 * Explicit secondary/tertiary accent pinning.
 *
 * A brand with a distinct accent (e.g. blue primary + yellow secondary) can PIN
 * its real accent colours instead of the engine deriving secondary/tertiary as
 * hue-rotations of the primary seed. These tests assert:
 *   1. pinning shifts the secondary/tertiary family HUE toward the pinned colour
 *      (and away from the derived one), and
 *   2. omitting the seeds is byte-identical to the pre-feature derived output.
 */
import {
  argbFromHex,
  generateRoleColors,
  type RoleColors,
} from '../color-engine';
import { Hct } from '../color-engine/hct';
import { buildSeedScopeVars } from '../color-scope/seed-scope';

/** Hue (deg) of an `rgb(r g b)` engine output string. */
function hueOf(rgb: string): number {
  const m = rgb.match(/rgb\((\d+) (\d+) (\d+)\)/);
  if (!m) throw new Error(`expected "rgb(r g b)", got: ${rgb}`);
  const argb = (0xff << 24) | (Number(m[1]) << 16) | (Number(m[2]) << 8) | Number(m[3]);
  return Hct.fromInt(argb >>> 0).hue;
}

/** Smallest absolute angular distance between two hues, in degrees (0–180). */
function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

const BLUE = '#1d9bf0';
const YELLOW = '#ffc300';
const PINK = '#ec4899';

describe('explicit accent pinning — generateRoleColors', () => {
  const derived: RoleColors = generateRoleColors({ seed: BLUE, variant: 'vivid', isDark: false });

  it('pins the secondary family to the supplied colour hue', () => {
    const pinned = generateRoleColors({
      seed: BLUE,
      variant: 'vivid',
      isDark: false,
      secondarySeed: YELLOW,
    });

    const yellowHue = Hct.fromInt(argbFromHex(YELLOW)).hue;
    // The pinned secondary family reads at the yellow hue…
    expect(hueDistance(hueOf(pinned.secondary), yellowHue)).toBeLessThan(20);
    // …and its container / on-colour roles share that hue family too.
    expect(hueDistance(hueOf(pinned.secondaryContainer), yellowHue)).toBeLessThan(20);
    expect(hueDistance(hueOf(pinned.onSecondaryContainer), yellowHue)).toBeLessThan(20);
    // …which differs materially from the derived (blue-rotation) secondary.
    expect(hueDistance(hueOf(pinned.secondary), hueOf(derived.secondary))).toBeGreaterThan(30);
  });

  it('pins the tertiary family independently of the secondary', () => {
    const pinned = generateRoleColors({
      seed: BLUE,
      variant: 'vivid',
      isDark: false,
      tertiarySeed: PINK,
    });

    const pinkHue = Hct.fromInt(argbFromHex(PINK)).hue;
    expect(hueDistance(hueOf(pinned.tertiary), pinkHue)).toBeLessThan(20);
    expect(hueDistance(hueOf(pinned.tertiary), hueOf(derived.tertiary))).toBeGreaterThan(20);
    // Secondary is untouched when only tertiary is pinned.
    expect(pinned.secondary).toBe(derived.secondary);
  });

  it('pins both accents at once, leaving primary + neutrals unchanged', () => {
    const pinned = generateRoleColors({
      seed: BLUE,
      variant: 'vivid',
      isDark: false,
      secondarySeed: YELLOW,
      tertiarySeed: PINK,
    });

    expect(hueDistance(hueOf(pinned.secondary), Hct.fromInt(argbFromHex(YELLOW)).hue)).toBeLessThan(20);
    expect(hueDistance(hueOf(pinned.tertiary), Hct.fromInt(argbFromHex(PINK)).hue)).toBeLessThan(20);
    // Primary + surfaces are seed-driven and must not move.
    expect(pinned.primary).toBe(derived.primary);
    expect(pinned.background).toBe(derived.background);
    expect(pinned.surfaceContainerLowest).toBe(derived.surfaceContainerLowest);
  });

  it('is byte-identical to the derived output when no accents are supplied', () => {
    const again = generateRoleColors({ seed: BLUE, variant: 'vivid', isDark: false });
    expect(again).toEqual(derived);
  });

  it('applies pinned accents in dark mode too', () => {
    const pinnedDark = generateRoleColors({
      seed: BLUE,
      variant: 'vivid',
      isDark: true,
      secondarySeed: YELLOW,
    });
    expect(hueDistance(hueOf(pinnedDark.secondary), Hct.fromInt(argbFromHex(YELLOW)).hue)).toBeLessThan(20);
  });
});

describe('explicit accent pinning — arbitrary-seed scope path', () => {
  it('threads pinned accents through buildSeedScopeVars', () => {
    const derivedVars = buildSeedScopeVars({ seed: BLUE, mode: 'light' });
    const pinnedVars = buildSeedScopeVars({
      seed: BLUE,
      mode: 'light',
      secondarySeed: YELLOW,
      tertiarySeed: PINK,
    });

    const yellowHue = Hct.fromInt(argbFromHex(YELLOW)).hue;
    const pinkHue = Hct.fromInt(argbFromHex(PINK)).hue;

    expect(pinnedVars['--secondary']).toBeDefined();
    expect(hueDistance(hueOf(pinnedVars['--secondary'] ?? ''), yellowHue)).toBeLessThan(20);
    expect(hueDistance(hueOf(pinnedVars['--tertiary'] ?? ''), pinkHue)).toBeLessThan(20);
    // The scoped `--color-*` alias tracks the pinned value too (web utility contract).
    expect(pinnedVars['--color-secondary']).toBe(pinnedVars['--secondary']);
    // Primary token is unchanged vs the derived scope.
    expect(pinnedVars['--primary']).toBe(derivedVars['--primary']);
    // Derived secondary differs from the pinned one.
    expect(pinnedVars['--secondary']).not.toBe(derivedVars['--secondary']);
  });
});
