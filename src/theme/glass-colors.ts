/**
 * The one resolver for "paint this surface as GLASS in the <tone> hue".
 *
 * Bloom already solves glass three times — `frosted-icon-button` (an
 * `expo-blur` `BlurView` plus a hand-tuned alpha palette in its own
 * `shared.ts`), `tab-bar` (`expo-glass-effect`, with a solid fallback) and
 * `progressive-blur` (a ten-layer falloff). This is the token layer the next
 * ones compose instead of adding a fourth, and it is deliberately the SMALLEST
 * piece: which colours, at which alphas. The layering itself is
 * `glass/GlassSurface.tsx`.
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
 * Every one of those maps onto something Bloom already owns, and NONE of them is
 * reproduced by composing a colour by hand:
 *
 * | reference                    | here                                    |
 * | ---------------------------- | --------------------------------------- |
 * | the 25% accent fill          | `resolveAccentColors(colors, tone, 'subtle').background` — the `*Subtle` tint, which the colour policy generates TOGETHER with the text that is legible on it |
 * | the label on that fill       | the same call's `.foreground` — the `*SubtleForeground` half of that pair |
 * | the full-strength hairline   | the same call at `'solid'` — `.background`, the tone's own fill |
 * | `0.5px`                      | `BORDER_WIDTH.hairline` |
 * | the box-shadow               | `bloomShadowStyle('glass')` |
 * | the sheen stops              | {@link GLASS_SHEEN}, white and black at ~2% |
 *
 * The alpha is the one place the port is NOT literal, and it is the important
 * one. `hsl(... / 25%)` is the reference composing a colour from a hue by hand;
 * Bloom's equivalent, `` `${colors.primary}40` ``, is a malformed string that
 * react-native-web reads back as fully OPAQUE — the defect that measured
 * contrast 1.00 in this library. The `*Subtle` pair exists precisely so no
 * component has to do that, so the alpha here is whatever the policy generated
 * (0.13 light / 0.24 dark) rather than the reference's 0.25.
 *
 * Pure — takes `ThemeColors` rather than calling `useTheme()`, so the gate can
 * walk every tone x mode x preset and composite without rendering.
 */
import { BORDER_WIDTH } from '../design-tokens/scales';
import { resolveAccentColors, type AccentTone } from './accent-colors';
import type { ThemeColors } from './types';

/** The semantic colour a glass surface speaks in — the same vocabulary as `Chip`. */
export type GlassTone = AccentTone;

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
 * It lives here rather than in the `glass` shadow role because an inset shadow
 * paints above an element's own background but BELOW its children, and every
 * glass surface is a stack of absolutely-positioned children — so an inset on
 * the outer box is covered by the first layer that lands on it. `GlassSurface`
 * paints this as the TOP layer of its own stack, which a caller-applied shadow
 * role cannot reach.
 */
export const GLASS_RIM_HIGHLIGHT = 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2)';

/**
 * Blur intensity handed to `expo-blur`, whose web build computes its radius as
 * `intensity * 0.2` px — so 50 is the reference's `blur(10px)`, on both
 * platforms, from one number.
 *
 * KNOWN COUPLING, and the reason this is a constant rather than a prop: the same
 * `intensity` also drives a tint of `expo-blur`'s own, from `tint`. There is no
 * way to ask that component for a blur radius WITHOUT one, so a glass surface is
 * always the accent fill over expo-blur's material over the page — which is why
 * the contrast gate composites three layers and not two.
 */
export const GLASS_BLUR_INTENSITY = 50;

/**
 * The same material, for a fork that renders a raw DOM element and therefore
 * cannot mount `GlassSurface`.
 *
 * `Button` is the case: its web fork is a real `<button>` rendered through
 * react-dom, and `GlassSurface` is a react-native component. Without these the
 * two forks would express "glass" independently and drift — which is the whole
 * problem this file exists to end, one level up.
 *
 * They REPRODUCE what `expo-blur`'s web build computes (`saturate(180%)
 * blur(intensity * 0.2px)`, plus a scheme tint at `intensity/100 * 0.78`) so a
 * button looks the same whichever fork a bundler resolves. That is a copy, and
 * it is guarded rather than trusted: `theme/__tests__/glass-colors.test.ts`
 * asserts these against the SHIPPED `getBackgroundColor.js`, so an expo-blur
 * version that changes its material fails the suite instead of silently
 * splitting the two platforms apart.
 */
export const GLASS_BLUR_FILTER = `saturate(180%) blur(${GLASS_BLUR_INTENSITY * 0.2}px)`;

/** `expo-blur`'s own scheme tint, the layer its `intensity` also drives. */
export function glassMaterialTint(isDark: boolean): string {
  const alpha = (GLASS_BLUR_INTENSITY / 100) * 0.78;
  return isDark ? `rgba(25, 25, 25, ${alpha})` : `rgba(249, 249, 249, ${alpha})`;
}

/**
 * The whole stack as a CSS `background-image` list — topmost layer first, which
 * is CSS's own order: sheen, then the accent tint, then the material.
 *
 * Two flat colours are spelled as one-stop gradients because `background-image`
 * takes images, not colours, and `background-color` is a single slot the caller
 * may want for something else.
 */
export function glassBackgroundImage(fill: string, isDark: boolean): string {
  const { top, middle, middleStop, bottom } = GLASS_SHEEN;
  return [
    `linear-gradient(180deg, ${top}, ${middle} ${middleStop * 100}%, ${bottom})`,
    `linear-gradient(${fill}, ${fill})`,
    `linear-gradient(${glassMaterialTint(isDark)}, ${glassMaterialTint(isDark)})`,
  ].join(', ');
}

export interface GlassColors {
  /** The translucent accent fill, from the `*Subtle` pair. */
  fill: string;
  /** The label/icon colour that pair guarantees is legible on `fill`. */
  fillForeground: string;
  /** The hairline, at the tone's FULL strength — the reference's `border` hue. */
  hairline: string;
  /** Width of that hairline. `0.5` on web; see `GlassSurface` for the native note. */
  hairlineWidth: number;
}

/**
 * Resolve the glass material for one tone.
 *
 * `isDark` is not a parameter: everything here reads from `colors`, which is
 * already the resolved palette for the active scheme. A surface that needed the
 * scheme would be deriving a colour, which is the thing this file exists to
 * avoid.
 */
export function resolveGlassColors(colors: ThemeColors, tone: GlassTone): GlassColors {
  const tint = resolveAccentColors(colors, tone, 'subtle');
  const solid = resolveAccentColors(colors, tone, 'solid');
  return {
    fill: tint.background,
    fillForeground: tint.foreground,
    hairline: solid.background,
    hairlineWidth: BORDER_WIDTH.hairline,
  };
}
