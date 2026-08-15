/**
 * `negativeSubtle` / `negativeSubtleForeground` are NOT a redundant spelling of
 * `errorSubtle` / `errorSubtleForeground`, and this exists because they look
 * exactly like one.
 *
 * In BOTH preset resolvers they are wired to the same two engine tokens:
 *
 *     build-theme.ts:            errorSubtle: g('error-subtle')
 *                                negativeSubtle: g('error-subtle')
 *     build-theme-from-seed.ts:  same pair
 *
 * so any comparison of resolved preset palettes reports them identical, and the
 * obvious tidy-up is to delete one pair. That tidy-up would be a silent
 * regression, because there is a THIRD resolver: on native, `mode="adaptive"`
 * overlays `getAdaptiveColors()` (Material You / iOS dynamic) over the preset
 * palette, and that overlay
 *
 *   - SUPPLIES `negativeSubtle` from a platform role — `errorContainer` on
 *     Android, `systemGray6`/`systemRed` on iOS — and
 *   - deliberately does NOT supply `errorSubtle`, which falls through to the
 *     engine's legibility-gated tint.
 *
 * So under an adaptive theme the two hold different values, and deleting the
 * `negative*Subtle` pair would drop the platform's own answer on every Material
 * You device. The relationship is enforced by the `AdaptiveColors` type, so the
 * gate is a type assertion — a runtime one cannot run at all here, since
 * `getAdaptiveColors()` needs native modules jest does not have.
 */
import type { AdaptiveColors } from '../adaptive-colors';
import type { ThemeColors } from '../types';

/** True when `Key` is a property of `T`. */
type Has<T, Key extends PropertyKey> = Key extends keyof T ? true : false;

describe('negativeSubtle is not an alias of errorSubtle', () => {
  it('the adaptive overlay supplies negativeSubtle and omits errorSubtle', () => {
    // The two assertions that carry the fact. Flipping either constant makes
    // `tsc` fail, which is the point: this cannot be satisfied at runtime.
    const suppliesNegativeSubtle: Has<AdaptiveColors, 'negativeSubtle'> = true;
    const suppliesNegativeSubtleForeground: Has<
      AdaptiveColors,
      'negativeSubtleForeground'
    > = true;
    const omitsErrorSubtle: Has<AdaptiveColors, 'errorSubtle'> = false;
    const omitsErrorSubtleForeground: Has<
      AdaptiveColors,
      'errorSubtleForeground'
    > = false;

    expect(suppliesNegativeSubtle).toBe(true);
    expect(suppliesNegativeSubtleForeground).toBe(true);
    expect(omitsErrorSubtle).toBe(false);
    expect(omitsErrorSubtleForeground).toBe(false);
  });

  it('both pairs are still declared on ThemeColors', () => {
    // The vacuity floor. `Has<>` reads `false` for a key that does not exist AND
    // for a type that failed to resolve, so without this the case above would
    // keep passing if `ThemeColors` lost the members entirely.
    const hasErrorSubtle: Has<ThemeColors, 'errorSubtle'> = true;
    const hasNegativeSubtle: Has<ThemeColors, 'negativeSubtle'> = true;

    expect(hasErrorSubtle).toBe(true);
    expect(hasNegativeSubtle).toBe(true);
  });
});
