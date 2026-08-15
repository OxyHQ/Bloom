/**
 * The one resolver for "paint this surface as GLASS in a given brand hue".
 *
 * Bloom already solves glass three times — `frosted-icon-button` (an
 * `expo-blur` `BlurView` plus a hand-tuned alpha palette in its own
 * `shared.ts`), `tab-bar` (`expo-glass-effect`, with a solid fallback) and
 * `progressive-blur` (a ten-layer falloff). This is the token layer the next
 * ones compose instead of adding a fourth, and it is deliberately the SMALLEST
 * piece: which colours, at which alphas. The layering itself is
 * `glass/GlassSurface.tsx` on native and `button/Button.web.tsx` on web.
 *
 * ── WHERE EACH VALUE COMES FROM ─────────────────────────────────────────────
 *
 * The reference this is ported from states the material as literals:
 *
 *     background-color: hsl(8.1deg 56.3% 61.3% / 25%)
 *     border: 0.5px solid hsl(8.1, 56.3%, 61.3%)
 *     box-shadow: inset 0 1px 0 0 rgba(255,255,255,.2),
 *                 0 0 1px 0 rgba(0,0,0,.12), 0 4px 8px 0 rgba(0,0,0,.12)
 *     backdrop-filter: blur(10px)
 *     background-image: linear-gradient(180deg, #ffffff05, #fff0 40%, #00000005)
 *
 * | reference                    | here                                    |
 * | ---------------------------- | --------------------------------------- |
 * | the 25% accent fill          | the caller's own brand fill at {@link GLASS_FILL_ALPHA} |
 * | the label on that fill       | `colors.text` — see {@link GlassColors.foreground} |
 * | the full-strength hairline   | the same fill, opaque — the edge of the pane |
 * | `0.5px`                      | `BORDER_WIDTH.hairline` |
 * | the box-shadow               | `bloomShadowStyle('glass')` + {@link GLASS_RIM_HIGHLIGHT} |
 * | `blur(10px)`                 | {@link GLASS_BLUR_RADIUS_PX} |
 * | the sheen stops              | {@link GLASS_SHEEN}, white and black at ~2% |
 *
 * ── WHY THE FILL IS THE SOLID TOKEN AT AN ALPHA, NOT THE `*Subtle` PAIR ─────
 *
 * The `*Subtle` tint is the right surface for a chip or a badge and the wrong
 * one here, and the difference is a factor of eight. `--primary-subtle` is its
 * own generated colour at alpha 0.13 (light) / 0.24 (dark), sized to be a
 * whisper of the hue ON THE PAGE. Composited under a material it contributes
 * roughly 3% of the pixel where the reference's fill contributes 25% — measured
 * on `oxy`/light, the difference between a tinted glass pill and a near-white
 * one with a coloured rim. That washout is what this file previously shipped.
 *
 * Reading the caller's SOLID fill and applying an alpha to it is the one colour
 * derivation in the library, and it is safe for a reason worth stating: the
 * defect the "never derive a colour from a token" rule exists to prevent is
 * `` `${colors.primary}1A` `` — string concatenation producing a MALFORMED value
 * that react-native-web parses back as fully opaque, so a control paints its
 * label on its own colour at contrast 1.00. {@link withAlpha} parses the token
 * and emits a well-formed `rgba()`, and the composite is gated:
 * `theme/__tests__/glass-colors.test.ts` walks every preset x mode x fill x
 * surface and computes the real WCAG ratio, so a fill that stopped being
 * translucent would be caught by the measurement rather than by the spelling.
 *
 * ── THE BACKDROP RANGE, AND WHY THERE IS NO SCRIM ───────────────────────────
 *
 * This file used to composite a neutral SCRIM under the accent fill, sized so
 * the whole stack reached 0.76 opacity — the alpha at which `colors.text`
 * clears AA over pure black AND pure white. That calibration is arithmetically
 * correct and it answers the wrong question, because 0.76 opacity is not glass:
 * it is a near-opaque card with a blur behind it.
 *
 * The question it answered was "what must a surface floating over ARBITRARY
 * content survive". A `Button` does not float over arbitrary content — it sits
 * on one of Bloom's own neutral surfaces (`background`, `backgroundSecondary`,
 * `backgroundTertiary`, `card`, `contrast50`), which is an enumerable set, and
 * over those the reference's own 25% needs no help. Measured across 18 presets
 * x 2 modes x 6 brand fills x those 5 surfaces = 1080 combinations, on both
 * platform stacks: nothing below AA, worst 5.39 (web) and 5.82 (native).
 *
 * The limit is real and is stated rather than engineered away: over pure black
 * or pure white, half that matrix falls below AA, worst 1.02. So does THE
 * REFERENCE — its own near-black label measures 4.05 over a mid-tone photo and
 * 1.20 over black. A surface that must survive unknown content is not this
 * material; it is `Button`'s `inverse` variant, which is opaque for exactly
 * this reason. `glass-colors.test.ts` asserts BOTH halves, so restoring a scrim
 * fails the suite instead of quietly returning the washout.
 *
 * Pure — takes `ThemeColors` rather than calling `useTheme()`, so the gate can
 * walk every fill x mode x preset and composite without rendering.
 */
import { BORDER_WIDTH } from '../design-tokens/scales';
import { withAlpha } from './color-utils';
import type { ThemeColors } from './types';

/**
 * How much of the caller's own brand fill the pane carries — the reference's `/ 25%`.
 *
 * It is the transparency, so it is the whole material: everything else here
 * (blur, sheen, rim, hairline) is hue-independent decoration around it. See the
 * backdrop-range note above for what 0.25 was measured against, and why it is
 * not raised.
 */
export const GLASS_FILL_ALPHA = 0.25;

/**
 * The sheen: simulated light from above, white at the top edge fading to nothing
 * by 40% and a trace of black at the bottom.
 *
 * These are the reference's `#ffffff05` and `#00000005` — 5/255 ≈ 2% — as real
 * `rgba()` strings, because an 8-digit hex is not a colour every RN surface
 * parses. White and black at 2% are light, not palette: there is no themed
 * "colour of a highlight", and tinting the sheen with the accent would make it
 * a second fill rather than a specular.
 */
export const GLASS_SHEEN = {
  top: 'rgba(255, 255, 255, 0.02)',
  middle: 'rgba(255, 255, 255, 0)',
  bottom: 'rgba(0, 0, 0, 0.02)',
  /** Where the top stop has faded out completely, 0..1 down the surface. */
  middleStop: 0.4,
} as const;

/**
 * The lit rim: a 1px hairline of white along the top edge.
 *
 * A different thing from {@link GLASS_SHEEN}, not a stronger version of it — the
 * rim is a hard edge where the light catches the lip of the pane, the sheen is
 * the soft falloff across its face. The reference carries both.
 *
 * It is not part of the `glass` shadow role because an inset shadow paints above
 * an element's own background but BELOW its children, and a native glass surface
 * is a stack of absolutely-positioned children — so an inset on the outer box is
 * covered by the first layer that lands on it. `GlassSurface` paints this as the
 * TOP layer of its own stack, which a caller-applied shadow role cannot reach.
 * The web fork has no such stack and composes it into one `box-shadow` list.
 */
export const GLASS_RIM_HIGHLIGHT = 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2)';

/** The reference's `blur(10px)` — the radius of the material, on both platforms. */
export const GLASS_BLUR_RADIUS_PX = 10;

/**
 * The web material, as a `backdrop-filter` value.
 *
 * The reference's filter verbatim: a blur and nothing else. No `saturate()` —
 * that is `expo-blur`'s addition, not the reference's, and the two are visibly
 * different over a colourful backdrop.
 */
export const GLASS_BLUR_FILTER = `blur(${GLASS_BLUR_RADIUS_PX}px)`;

/**
 * The sheen as one CSS `linear-gradient`, for a fork that renders a raw DOM
 * element and sets `background-image` directly.
 *
 * Derived from {@link GLASS_SHEEN} rather than written out, so the web fork and
 * the native `Svg` gradient cannot drift to different stops.
 */
export const GLASS_SHEEN_GRADIENT = `linear-gradient(180deg, ${GLASS_SHEEN.top}, ${GLASS_SHEEN.middle} ${GLASS_SHEEN.middleStop * 100}%, ${GLASS_SHEEN.bottom})`;

/**
 * Intensity handed to `expo-blur`'s `BlurView` on NATIVE, derived from
 * {@link GLASS_BLUR_RADIUS_PX} through the `intensity * 0.2` px radius its web
 * build computes.
 *
 * KNOWN PLATFORM DIFFERENCE, stated rather than papered over: `expo-blur` cannot
 * be asked for a blur radius WITHOUT also painting a tint of its own — one
 * `intensity` drives both, at `intensity/100 * 0.78` — whereas CSS
 * `backdrop-filter` is a pure blur. So the native pane carries one extra neutral
 * layer the web pane does not.
 *
 * It is a small difference and it is measured: because that tint is the SCHEME's
 * own colour (near-white in light, near-black in dark) and the backdrop range is
 * Bloom's own neutral surfaces, it composites onto something it already
 * resembles. Over those 1080 combinations the two stacks' worst ratios are 5.39
 * (web) and 5.82 (native) — the native pane is marginally the safer of the two.
 * Over arbitrary content they diverge, which is the case neither platform
 * supports.
 */
export const GLASS_BLUR_INTENSITY = GLASS_BLUR_RADIUS_PX / 0.2;

export interface GlassColors {
  /** The translucent accent fill — the caller's brand fill at {@link GLASS_FILL_ALPHA}. */
  fill: string;
  /**
   * The label/icon colour — `colors.text`, the page's own reading colour, and
   * deliberately NOT the fill family's `*SubtleForeground`.
   *
   * The direction is forced by arithmetic, not chosen. A glass surface's
   * luminance follows whatever is behind it, and behind it is one of Bloom's
   * neutral surfaces — so in light mode the pane is light and the label must be
   * dark, and in dark mode the mirror image. `colors.text` is already the token
   * that sits there, in both schemes, for every preset.
   *
   * The matching `*SubtleForeground` cannot be used: it is a mid-tone brand
   * colour calibrated for the tint AS COMPOSITED OVER THE PAGE, and under a
   * material it lands too close to the surface it sits on. The brand hue lives
   * in the FILL and the HAIRLINE; the label is neutral. That is also what the
   * reference does — its label is `text-text`, the page's reading colour, not
   * its own coral.
   */
  foreground: string;
  /** The hairline: the SAME fill at full strength — the reference's `border` hue. */
  hairline: string;
  /** Width of that hairline. `0.5` on web; see `GlassSurface` for the native note. */
  hairlineWidth: number;
}

/**
 * Resolve the glass material around ONE opaque brand fill.
 *
 * `fill` is a resolved token the caller already holds — `colors.primary`,
 * `colors.negative`, `colors.success` — rather than a tone name, because the
 * caller is the only one who knows which token its variant means. `Button`'s
 * `destructive` is `colors.negative` (the engine's error ROLE) and not
 * `colors.error` (the fixed status seed): measured, those two differ in all 36
 * preset x mode combinations and by as much as `rgb(255 180 171)` against
 * `rgb(209 45 50)` on `teal`/dark, so a tone vocabulary here would have
 * silently repainted every destructive button on the way past.
 *
 * `isDark` is not a parameter either: everything here reads from `colors`,
 * which is already the resolved palette for the active scheme.
 */
export function resolveGlassColors(colors: ThemeColors, fill: string): GlassColors {
  return {
    fill: withAlpha(fill, GLASS_FILL_ALPHA),
    foreground: colors.text,
    hairline: fill,
    hairlineWidth: BORDER_WIDTH.hairline,
  };
}
