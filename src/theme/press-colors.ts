/**
 * The one answer to "what does a Bloom control look like while it is held?"
 *
 * Seven families — `Button`, `Fab`, `Chip`, `Tabs`, `Checkbox`, `Radio`,
 * `FrostedIconButton` — used to answer it with a SCALE: a spring on an
 * `Animated.Value` driving `transform: [{ scale }]` on native, and a
 * `transform: scale(var(--<prefix>-press-scale, 1))` `:active` rule on web. They
 * now answer it with a BACKGROUND, which is what both references this library is
 * matched against do (react-native-reusables' `active:bg-accent`, the menu
 * reference's `data-[highlighted]:bg-button-ghost-hover`) and which — unlike a
 * transform — is the same affordance on both platforms.
 *
 * ── WHY A COMPOSITE AND NOT `withAlpha(fill, 0.9)` ──────────────────────────
 *
 * shadcn spells the filled case `active:bg-primary/90`: the fill at 90%, so the
 * page shows through by a tenth. That is invisible whenever the fill is near the
 * page colour, and two of Bloom's own surfaces are: `inverse` is `#FFFFFF` on a
 * light page (`oxy` light is `rgb(255 239 253)`, so a 90% white moves by 1.6 of
 * 255 — nothing), and a `surface` FAB is `--card`, white on the same page. A FAB
 * also floats over ARBITRARY content, and `FrostedIconButton` sits over
 * photographs by design, so "let what is behind show through" is not a
 * definition that survives contact with this library.
 *
 * So a filled control keeps its hue and gains a STATE LAYER of its own LABEL
 * colour — Material's model. The label colour is the one colour guaranteed to
 * contrast with the fill it sits on, so the step is visible whatever the fill,
 * whatever the mode, and whatever is behind. At {@link PRESS_LAYER_ALPHA} it
 * lands within three units per channel of where `bg-primary/90` lands in light
 * mode, and keeps working in dark mode where that spelling inverts.
 *
 * ── WHY `contrast50` FOR AN UNFILLED CONTROL ────────────────────────────────
 *
 * There is no fill to layer onto, so the press IS the fill. `contrast50` is
 * `--muted`, which every preset resolves to the same value as `--accent` — so
 * this is literally `active:bg-accent`, and it is the wash `Item`,
 * `SubtleHover`, `SegmentedControl` and every menu row already paint. A pressed
 * ghost button and a highlighted menu row are then the same colour, which is the
 * point: one press vocabulary, not seven.
 *
 * Pure — takes `ThemeColors` rather than calling `useTheme()`, so the gate can
 * walk every preset x mode x family without rendering.
 */
import { parseRgba } from './color-utils';
import type { ThemeColors } from './types';

/**
 * Opacity of the pressed state layer, Material 3's value for the pressed state.
 *
 * One number for the whole library. A press is the loudest of the three
 * interaction states, so nothing else may exceed it: `SubtleHover` and the
 * hover rules sit below.
 */
export const PRESS_LAYER_ALPHA = 0.12;

/** Composite `layer` at `alpha` over `base`, both already parsed. */
function sourceOver(
  base: { r: number; g: number; b: number; a: number },
  layer: { r: number; g: number; b: number },
  alpha: number,
): string {
  // Porter-Duff source-over. `base.a` is carried through rather than assumed to
  // be 1, because half the palette is translucent: the `*Subtle` tints a `Chip`
  // paints resolve to `rgba(r, g, b, 0.13)`, and `FrostedIconButton`'s whole
  // surface is a low-alpha tint of the text colour. Flattening those to opaque
  // would turn a tint into a fill and a frosted chip into a solid disc.
  const outA = alpha + base.a * (1 - alpha);
  const mix = (l: number, b: number): number =>
    Math.round((l * alpha + b * base.a * (1 - alpha)) / outA);
  const r = mix(layer.r, base.r);
  const g = mix(layer.g, base.g);
  const b = mix(layer.b, base.b);
  if (outA >= 1) return `rgb(${r} ${g} ${b})`;
  return `rgba(${r}, ${g}, ${b}, ${Number(outA.toFixed(4))})`;
}

/**
 * The background a control paints while it is held.
 *
 * @param colors - The resolved palette, for the unfilled case's neutral wash.
 * @param surface - What the control paints at REST. `'transparent'` — or
 *   anything unparseable — means it has no fill of its own.
 * @param layer - The control's own label/icon colour, used as the state layer.
 *
 * Both fallbacks land on `contrast50` rather than returning `surface` unchanged,
 * because "no press feedback at all" is the failure this whole change exists to
 * remove, and an unparseable colour is exactly what a caller-supplied one
 * (`Checkbox`'s `color`, `Radio`'s `color`) can be — a CSS keyword parses to
 * neither.
 */
export function pressedSurface(
  colors: ThemeColors,
  surface: string,
  layer: string,
): string {
  const base = parseRgba(surface);
  if (!base || base.a === 0) return colors.contrast50;
  const top = parseRgba(layer);
  if (!top) return colors.contrast50;
  return sourceOver(base, top, PRESS_LAYER_ALPHA);
}
