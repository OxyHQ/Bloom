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
 *     background-color: rgba(212, 116, 101, 0.85)
 *     border: 0.5px solid rgb(212, 116, 101)
 *     box-shadow: inset 0 1px 0 0 rgba(255,255,255,.2),
 *                 0 0 1px 0 rgba(0,0,0,.12), 0 4px 8px 0 rgba(0,0,0,.12)
 *     backdrop-filter: blur(10px)
 *     background-image: linear-gradient(180deg, #ffffff05, #fff0 40%, #00000005)
 *
 * | reference                    | here                                    |
 * | ---------------------------- | --------------------------------------- |
 * | the 85% brand fill           | the caller's own brand fill at {@link GLASS_FILL_ALPHA} |
 * | the label on that fill       | the fill's OWN on-colour, held by the caller — see {@link resolveGlassColors} |
 * | the full-strength hairline   | the same fill, opaque — the edge of the pane |
 * | `0.5px`                      | `BORDER_WIDTH.hairline` |
 * | the box-shadow               | `bloomShadowStyle('glass')` + {@link GLASS_RIM_HIGHLIGHT} |
 * | `blur(10px)`                 | {@link GLASS_BLUR_RADIUS_PX} |
 * | the sheen stops              | {@link GLASS_SHEEN}, white and black at ~2% |
 *
 * ── WHY THE FILL IS THE SOLID TOKEN AT AN ALPHA, NOT THE `*Subtle` PAIR ─────
 *
 * The `*Subtle` tint is the right surface for a chip or a badge and the wrong
 * one here. `--primary-subtle` is its own generated colour at alpha 0.13 (light)
 * / 0.24 (dark), sized to be a whisper of the hue ON THE PAGE; composited under
 * a material it contributes roughly 3% of the pixel. The reference's fill
 * contributes 85%. Those are not the same surface with a different number on
 * it, they are a stain and a pane.
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
 * This file briefly composited a neutral SCRIM under the fill, sized so the
 * whole stack reached 0.76 opacity. There is none now, and at 0.85 there is
 * nothing for one to do: the fill IS the opacity. A scrim would only dilute the
 * hue the pane exists to show.
 *
 * The backdrop range still matters, because it is what the legibility numbers
 * are measured against, and it is enumerable rather than "anything": a `Button`
 * sits on one of Bloom's own neutral surfaces (`background`,
 * `backgroundSecondary`, `backgroundTertiary`, `card`, `contrast50`). Over
 * arbitrary content — a photograph, a video still — this material is no safer
 * than any other 85% fill, and the variant for that case is `inverse`, which is
 * fully opaque.
 *
 * Pure — takes resolved colour strings rather than calling `useTheme()`, so the
 * gate can walk every fill x mode x preset and composite without rendering.
 */
import { BORDER_WIDTH } from '../design-tokens/scales';
import { withAlpha } from './color-utils';

/**
 * How much of the caller's own brand fill the pane carries — the reference's
 * `rgba(212, 116, 101, 0.85)`.
 *
 * ── THE GLASS IS THE SHEEN, NOT THE WASH ────────────────────────────────────
 *
 * This shipped once at 0.25, and 0.25 is a WASH: the backdrop dominates, the
 * pane has no body, and the brand reads as a pale stain. What makes a pane read
 * as glass is the lit top rim, the vertical sheen, the hairline in the fill's
 * own hue and the blur behind the few percent that do get through — not the
 * amount you can see through it. At 0.85 the pane is a nearly-solid tinted
 * surface that you can just sense the backdrop behind, which is what the
 * reference is and what the earlier value was not.
 *
 * ── WHAT 0.85 COSTS, STATED RATHER THAN HIDDEN ──────────────────────────────
 *
 * The 15% that bleeds through moves the pane TOWARD the surface under it, and
 * in light mode that means lighter — which is the direction a white label can
 * least afford. Measured over 64 presets x 2 modes x 5 Bloom surfaces:
 *
 *   `Button` primary     67 of 640 rows fall below WCAG AA, in the band
 *                        4.21..4.50, ALL of them in LIGHT mode, across 27
 *                        presets (acid-canopy, arctic-signal, blue, bronze-neon,
 *                        clay-current, copper-field, electric-tide, faircoin,
 *                        green, lagoon, lavender, malachite-rush,
 *                        midnight-citrus, mint, olive, orange, pacific-flare,
 *                        pine, plum, pumpkin, reef-pulse, rose, saffron-depth,
 *                        sky, solar-flux, viridian-orbit, yellow).
 *   `Button` destructive 0 of 640. Worst 5.32.
 *
 * As a SOLID fill all 1280 Button rows pass. Approved chroma 28 surfaces move
 * the earlier 73/640 baseline to 67/640. Historical cohorts now measure 36/340
 * (including the original 18 presets' 28/180) plus 31/300 additions.
 *
 * In the historical low-chroma sweep, failures reached zero at **0.89**
 * (worst 4.52), and the
 * curve between is steep: 0.86 -> 49 rows, 0.87 -> 26, 0.88 -> 8, 0.89 -> 0.
 * So AA compliance costs four hundredths of alpha. 0.85 is kept because it is
 * the reference's own value and matching the reference is the requirement;
 * `glass-colors.test.ts` pins the compromise as an EXACT failure count and an
 * exact worst ratio rather than as a loosened threshold, so moving the alpha in
 * either direction fails the suite and has to be a decision rather than a
 * drift.
 */
export const GLASS_FILL_ALPHA = 0.85;

/**
 * The sheen: simulated light from above, white at the top edge fading to nothing
 * by 40% and a trace of black at the bottom.
 *
 * These are the reference's `#ffffff05` and `#00000005` — 5/255 ≈ 2%. White and
 * black at 2% are light, not palette: there is no themed "colour of a
 * highlight", and tinting the sheen with the accent would make it a second fill
 * rather than a specular.
 *
 * ── WHY THE OPACITY IS A SEPARATE FIELD, NOT AN `rgba()` STRING ──────────────
 *
 * These stops feed TWO renderers with different models of where alpha lives. A
 * CSS `linear-gradient` takes it inside the colour; SVG has separate
 * `stop-color` and `stop-opacity` properties and `react-native-svg` follows SVG
 * — it parses `stopColor` for its RGB and DISCARDS the alpha channel.
 *
 * So an `rgba(255, 255, 255, 0.02)` stop is correct on web and renders OPAQUE
 * WHITE on native. Measured on an Android emulator (API 37) before this shape
 * existed: the pane ran a solid white-to-black wipe from 255 at the top to 12 at
 * the bottom, with the break at exactly 40% — {@link GLASS_SHEEN.middleStop} —
 * and the brand fill under it was not visible at ANY pixel, R=G=B throughout.
 * The glass button was achromatic on Android and correct on web.
 *
 * Nothing threw, and no gate saw it: the token was shared, the gradient was
 * built from it, and both forks agreed about every VALUE. Only the SVG
 * renderer's reading of that value differed. Holding the opacity in its own
 * field removes the representation that can be silently half-read — the web
 * string is derived below, and native passes the two fields to the two props
 * SVG actually defines.
 */
export const GLASS_SHEEN = {
  top: { color: 'rgb(255, 255, 255)', opacity: 0.02 },
  middle: { color: 'rgb(255, 255, 255)', opacity: 0 },
  bottom: { color: 'rgb(0, 0, 0)', opacity: 0.02 },
  /** Where the top stop has faded out completely, 0..1 down the surface. */
  middleStop: 0.4,
} as const;

/** One sheen stop as a CSS colour, for the fork whose gradient carries alpha inline. */
export type GlassSheenStop = { readonly color: string; readonly opacity: number };

/** A stop as a single CSS `rgba()` — the web gradient's form. */
export function glassSheenCss(stop: GlassSheenStop): string {
  return withAlpha(stop.color, stop.opacity);
}

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

/** The reference's pure CSS `blur(10px)`, retained on web. */
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
 * the native `Svg` gradient cannot drift to different stops. Note what that
 * guarantee does and does not cover: it pins the two to the same VALUES, which
 * is why it stayed green while native rendered them opaque — see the alpha note
 * on {@link GLASS_SHEEN}. Sharing a token is not the same as agreeing about it.
 */
export const GLASS_SHEEN_GRADIENT = `linear-gradient(180deg, ${glassSheenCss(GLASS_SHEEN.top)}, ${glassSheenCss(GLASS_SHEEN.middle)} ${GLASS_SHEEN.middleStop * 100}%, ${glassSheenCss(GLASS_SHEEN.bottom)})`;

/**
 * Native expo-blur intensity is capped at 30 to preserve saturated backdrops.
 * Its unavoidable neutral tint is intensity/100 * 0.78; CSS blur has no tint.
 * With the approved chroma 28 surfaces, intensity 50 caused a 6.478/255 maximum
 * painted-channel divergence. Intensity 30 reduces that to 3.887/255 without
 * changing fill alpha 0.85, sheen, hairline, or the web's 10px blur.
 *
 * This deliberately trades native blur strength for closer material colour.
 * The web intensity-to-radius approximation would be 6px, not 10px; actual
 * native blur remains platform-dependent. The gate keeps the original <4
 * colour-gap ceiling and >1 nonzero-tint discriminator; it does not claim
 * equivalent spatial blur or replace real-device verification.
 */
export const GLASS_BLUR_INTENSITY = 30;

export interface GlassColors {
  /** The translucent pane — the caller's brand fill at {@link GLASS_FILL_ALPHA}. */
  fill: string;
  /** The hairline: the SAME fill at full strength — the reference's `border` hue. */
  hairline: string;
  /** Width of that hairline. `0.5` on web; see `GlassSurface` for the native note. */
  hairlineWidth: number;
}

/**
 * Resolve the PANE around one opaque brand fill.
 *
 * `fill` is a resolved token the caller already holds — `colors.primary`,
 * `colors.negative`, `colors.success` — rather than a tone name, because the
 * caller is the only one who knows which token its variant means. `Button`'s
 * `destructive` is `colors.negative` (the engine's error ROLE) and not
 * `colors.error` (the fixed status seed): measured, those two differ in all 128
 * preset x mode combinations and by as much as `rgb(255 180 171)` against
 * `rgb(209 45 50)` on `teal`/dark, so a tone vocabulary here would have
 * silently repainted every destructive button on the way past.
 *
 * ── THE LABEL IS NOT RETURNED, AND THAT IS THE POINT ────────────────────────
 *
 * A glass pane's label is the fill's OWN on-colour — `primaryForeground` for
 * `primary`, `negativeForeground` for `destructive` — which the caller is
 * already holding beside the fill it passed in. Returning it would be a
 * pass-through pretending to be a decision.
 *
 * It is worth writing down WHY it is that token, because at 0.25 it was
 * `colors.text` and that was correct THEN: a pane that is three-quarters
 * backdrop takes its luminance from the page, so it needed the page's reading
 * colour. At 0.85 the pane is the fill, so it takes the fill's own label: on
 * the complete 3840-row matrix (64 presets x 2 modes x 6 tones x 5 surfaces),
 * `colors.text` now fails AA on 2577 rows against the on-fill token's 480.
 * The 1.0.1 cohort measures 1377/2040 versus 258/2040; the 30 additions
 * contribute 1200/1800 versus 222/1800. Before chroma 28, those totals were
 * 3232 versus 577 (historical worst 1.21 versus 4.17). The gate re-measures
 * and pins both on every alpha or surface change.
 */
export function resolveGlassColors(fill: string): GlassColors {
  return {
    fill: withAlpha(fill, GLASS_FILL_ALPHA),
    hairline: fill,
    hairlineWidth: BORDER_WIDTH.hairline,
  };
}
/**
 * The CHROME alpha — the neutral counterpart of {@link GLASS_FILL_ALPHA}.
 *
 * ── WHY A SECOND ALPHA AND NOT THE SAME ONE ─────────────────────────────────
 *
 * {@link GLASS_FILL_ALPHA} prices a BRAND fill: a `primary` button whose label
 * is that fill's own on-colour, sitting on one of Bloom's five neutral
 * surfaces. A page header's island is neither of those things. It is a NEUTRAL
 * surface off the existing ladder (`styles/surface-levels`, rung 1 — the same
 * fill a card and a menu panel paint) and it floats over content Bloom does not
 * own: a photograph, a video still, a map, a list that scrolls under it. Its
 * label is the theme's own `text`, not an on-fill token.
 *
 * So the two materials are priced against different backdrops, and the number
 * that is right for one is wrong for the other in a measurable direction:
 *
 *   brand fill   backdrop ∈ Bloom's own five surfaces      worst case: light mode,
 *                                                          a white-ish page LIFTS
 *                                                          the pane under a white
 *                                                          label
 *   chrome fill  backdrop ∈ [black, white] — anything      worst case: DARK mode
 *                                                          over a WHITE backdrop,
 *                                                          which lifts a dark pane
 *                                                          under a white label
 *
 * That is why dark carries the HIGHER alpha here and light the lower one, which
 * is the opposite of the intuition that a dark UI can afford more transparency.
 * A dark island has the whole luminance range above it to be washed out INTO; a
 * light island over the same white backdrop barely moves, because it is already
 * near white.
 *
 * ── WHAT THESE TWO VALUES BUY ───────────────────────────────────────────────
 *
 * Measured over 64 presets x the two extremes of the backdrop range, with the
 * theme's own `text` as the label, in `theme/__tests__/glass-colors.test.ts`.
 * The gate pins the floors EXACTLY, in both directions, so a hundredth in
 * either direction has to be a decision:
 *
 *   light 0.72  worst AA ratio over the range  …pinned by the gate
 *   dark  0.80  worst AA ratio over the range  …pinned by the gate
 *
 * and both remain genuinely translucent: the gate also measures how far the
 * PAINTED pane moves between a black and a white backdrop, asserts that
 * movement is non-zero, and asserts it is monotonic in the alpha — so an alpha
 * quietly raised to 1.0 to buy contrast fails on the translucency side rather
 * than passing on the legibility side.
 */
export const GLASS_CHROME_ALPHA = { light: 0.72, dark: 0.8 } as const;

/**
 * Resolve the pane around a NEUTRAL chrome fill — an island of controls
 * floating over content.
 *
 * Both arguments are resolved colour strings the caller already holds, for the
 * same reason {@link resolveGlassColors} takes one: the caller is the only one
 * who knows which rung of the surface ladder its container sits on. In practice
 * that is `resolveSurfaceLevel(theme, 1)` — `.background` for `fill`, `.border`
 * for `hairline` — which is the fill a card and a menu panel already paint, so
 * an island reads as Bloom chrome rather than as a fourth material.
 *
 * The LABEL is not returned, exactly as in `resolveGlassColors`: a neutral pane
 * carries the theme's own `text`, and the rungs under it come from
 * `surfaceTextOn(theme, fill)` — the caller is already holding both.
 */
export function resolveChromeGlassColors(
  fill: string,
  hairline: string,
  isDark: boolean,
): GlassColors {
  return {
    fill: withAlpha(fill, GLASS_CHROME_ALPHA[isDark ? 'dark' : 'light']),
    // The hairline keeps a little more body than the pane it edges: it is the
    // lip of the island, and a hairline that dissolves at the same rate as the
    // fill stops reading as an edge at exactly the moment the fill stops
    // reading as a surface.
    hairline: withAlpha(hairline, Math.min(1, GLASS_CHROME_ALPHA[isDark ? 'dark' : 'light'] + 0.12)),
    hairlineWidth: BORDER_WIDTH.hairline,
  };
}
