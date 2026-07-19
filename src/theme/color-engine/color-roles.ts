/**
 * Bloom colour engine — the colour roles.
 *
 * Faithful port of Material Color Utilities' `MaterialDynamicColors` (Apache-2.0),
 * renamed to Bloom's own `Roles`. Each role is a {@link ColorRole} recipe over
 * the scheme's palettes: surfaces, on-surfaces, the accent trio + their
 * containers, outlines and error. Resolving a role against a scheme yields the
 * final colour. The 12 "*Fixed" roles the reference ships are omitted — Bloom's
 * token contract doesn't use them.
 */
import { ColorRole } from './color-role';
import { ContrastCurve } from './contrast-curve';
import type { DynamicScheme } from './dynamic-scheme';
import { fixIfDisliked } from './dislike-analyzer';
import { Hct } from './hct';
import { ToneDeltaPair } from './tone-delta-pair';
import { Variant } from './variant';

const isFidelity = (s: DynamicScheme): boolean =>
  s.variant === Variant.FIDELITY || s.variant === Variant.CONTENT;
const isMonochrome = (s: DynamicScheme): boolean => s.variant === Variant.MONOCHROME;

/** For fidelity schemes: find the tone nearest a target chroma. */
function findDesiredChromaByTone(
  hue: number,
  chroma: number,
  tone: number,
  byDecreasingTone: boolean,
): number {
  let answer = tone;
  let closestToChroma = Hct.from(hue, chroma, tone);
  if (closestToChroma.chroma < chroma) {
    let chromaPeak = closestToChroma.chroma;
    while (closestToChroma.chroma < chroma) {
      answer += byDecreasingTone ? -1.0 : 1.0;
      const potentialSolution = Hct.from(hue, chroma, answer);
      if (chromaPeak > potentialSolution.chroma) break;
      if (Math.abs(potentialSolution.chroma - chroma) < 0.4) break;
      const potentialDelta = Math.abs(potentialSolution.chroma - chroma);
      const currentDelta = Math.abs(closestToChroma.chroma - chroma);
      if (potentialDelta < currentDelta) closestToChroma = potentialSolution;
      chromaPeak = Math.max(chromaPeak, potentialSolution.chroma);
    }
  }
  return answer;
}

/** The most-elevated surface a scheme can show — the brightest/dimmest ground. */
const highestSurface = (s: DynamicScheme): ColorRole => (s.isDark ? surfaceBright : surfaceDim);

// ---- palette key colours ----
const primaryPaletteKeyColor = ColorRole.fromPalette({
  name: 'primary_palette_key_color',
  palette: (s) => s.primaryPalette,
  tone: (s) => s.primaryPalette.keyColor.tone,
});
const secondaryPaletteKeyColor = ColorRole.fromPalette({
  name: 'secondary_palette_key_color',
  palette: (s) => s.secondaryPalette,
  tone: (s) => s.secondaryPalette.keyColor.tone,
});
const tertiaryPaletteKeyColor = ColorRole.fromPalette({
  name: 'tertiary_palette_key_color',
  palette: (s) => s.tertiaryPalette,
  tone: (s) => s.tertiaryPalette.keyColor.tone,
});
const neutralPaletteKeyColor = ColorRole.fromPalette({
  name: 'neutral_palette_key_color',
  palette: (s) => s.neutralPalette,
  tone: (s) => s.neutralPalette.keyColor.tone,
});
const neutralVariantPaletteKeyColor = ColorRole.fromPalette({
  name: 'neutral_variant_palette_key_color',
  palette: (s) => s.neutralVariantPalette,
  tone: (s) => s.neutralVariantPalette.keyColor.tone,
});

// ---- surfaces ----
const background = ColorRole.fromPalette({
  name: 'background',
  palette: (s) => s.neutralPalette,
  tone: (s) => (s.isDark ? 6 : 98),
  isBackground: true,
});
const onBackground = ColorRole.fromPalette({
  name: 'on_background',
  palette: (s) => s.neutralPalette,
  tone: (s) => (s.isDark ? 90 : 10),
  background: () => background,
  contrastCurve: new ContrastCurve(3, 3, 4.5, 7),
});
const surface = ColorRole.fromPalette({
  name: 'surface',
  palette: (s) => s.neutralPalette,
  tone: (s) => (s.isDark ? 6 : 98),
  isBackground: true,
});
const surfaceDim = ColorRole.fromPalette({
  name: 'surface_dim',
  palette: (s) => s.neutralPalette,
  tone: (s) => (s.isDark ? 6 : new ContrastCurve(87, 87, 80, 75).get(s.contrastLevel)),
  isBackground: true,
});
const surfaceBright = ColorRole.fromPalette({
  name: 'surface_bright',
  palette: (s) => s.neutralPalette,
  tone: (s) => (s.isDark ? new ContrastCurve(24, 24, 29, 34).get(s.contrastLevel) : 98),
  isBackground: true,
});
const surfaceContainerLowest = ColorRole.fromPalette({
  name: 'surface_container_lowest',
  palette: (s) => s.neutralPalette,
  tone: (s) => (s.isDark ? new ContrastCurve(4, 4, 2, 0).get(s.contrastLevel) : 100),
  isBackground: true,
});
const surfaceContainerLow = ColorRole.fromPalette({
  name: 'surface_container_low',
  palette: (s) => s.neutralPalette,
  tone: (s) =>
    s.isDark
      ? new ContrastCurve(10, 10, 11, 12).get(s.contrastLevel)
      : new ContrastCurve(96, 96, 96, 95).get(s.contrastLevel),
  isBackground: true,
});
const surfaceContainer = ColorRole.fromPalette({
  name: 'surface_container',
  palette: (s) => s.neutralPalette,
  tone: (s) =>
    s.isDark
      ? new ContrastCurve(12, 12, 16, 20).get(s.contrastLevel)
      : new ContrastCurve(94, 94, 92, 90).get(s.contrastLevel),
  isBackground: true,
});
const surfaceContainerHigh = ColorRole.fromPalette({
  name: 'surface_container_high',
  palette: (s) => s.neutralPalette,
  tone: (s) =>
    s.isDark
      ? new ContrastCurve(17, 17, 21, 25).get(s.contrastLevel)
      : new ContrastCurve(92, 92, 88, 85).get(s.contrastLevel),
  isBackground: true,
});
const surfaceContainerHighest = ColorRole.fromPalette({
  name: 'surface_container_highest',
  palette: (s) => s.neutralPalette,
  tone: (s) =>
    s.isDark
      ? new ContrastCurve(22, 22, 26, 30).get(s.contrastLevel)
      : new ContrastCurve(90, 90, 84, 80).get(s.contrastLevel),
  isBackground: true,
});
const onSurface = ColorRole.fromPalette({
  name: 'on_surface',
  palette: (s) => s.neutralPalette,
  tone: (s) => (s.isDark ? 90 : 10),
  background: (s) => highestSurface(s),
  contrastCurve: new ContrastCurve(4.5, 7, 11, 21),
});
const surfaceVariant = ColorRole.fromPalette({
  name: 'surface_variant',
  palette: (s) => s.neutralVariantPalette,
  tone: (s) => (s.isDark ? 30 : 90),
  isBackground: true,
});
const onSurfaceVariant = ColorRole.fromPalette({
  name: 'on_surface_variant',
  palette: (s) => s.neutralVariantPalette,
  tone: (s) => (s.isDark ? 80 : 30),
  background: (s) => highestSurface(s),
  contrastCurve: new ContrastCurve(3, 4.5, 7, 11),
});
const inverseSurface = ColorRole.fromPalette({
  name: 'inverse_surface',
  palette: (s) => s.neutralPalette,
  tone: (s) => (s.isDark ? 90 : 20),
});
const inverseOnSurface = ColorRole.fromPalette({
  name: 'inverse_on_surface',
  palette: (s) => s.neutralPalette,
  tone: (s) => (s.isDark ? 20 : 95),
  background: () => inverseSurface,
  contrastCurve: new ContrastCurve(4.5, 7, 11, 21),
});
const outline = ColorRole.fromPalette({
  name: 'outline',
  palette: (s) => s.neutralVariantPalette,
  tone: (s) => (s.isDark ? 60 : 50),
  background: (s) => highestSurface(s),
  contrastCurve: new ContrastCurve(1.5, 3, 4.5, 7),
});
const outlineVariant = ColorRole.fromPalette({
  name: 'outline_variant',
  palette: (s) => s.neutralVariantPalette,
  tone: (s) => (s.isDark ? 30 : 80),
  background: (s) => highestSurface(s),
  contrastCurve: new ContrastCurve(1, 1, 3, 4.5),
});
const shadow = ColorRole.fromPalette({
  name: 'shadow',
  palette: (s) => s.neutralPalette,
  tone: () => 0,
});
const scrim = ColorRole.fromPalette({
  name: 'scrim',
  palette: (s) => s.neutralPalette,
  tone: () => 0,
});
const surfaceTint = ColorRole.fromPalette({
  name: 'surface_tint',
  palette: (s) => s.primaryPalette,
  tone: (s) => (s.isDark ? 80 : 40),
  isBackground: true,
});

// ---- primary ----
const primary = ColorRole.fromPalette({
  name: 'primary',
  palette: (s) => s.primaryPalette,
  tone: (s) => (isMonochrome(s) ? (s.isDark ? 100 : 0) : s.isDark ? 80 : 40),
  isBackground: true,
  background: (s) => highestSurface(s),
  contrastCurve: new ContrastCurve(3, 4.5, 7, 7),
  toneDeltaPair: () => new ToneDeltaPair(primaryContainer, primary, 10, 'nearer', false),
});
const onPrimary = ColorRole.fromPalette({
  name: 'on_primary',
  palette: (s) => s.primaryPalette,
  tone: (s) => (isMonochrome(s) ? (s.isDark ? 10 : 90) : s.isDark ? 20 : 100),
  background: () => primary,
  contrastCurve: new ContrastCurve(4.5, 7, 11, 21),
});
const primaryContainer = ColorRole.fromPalette({
  name: 'primary_container',
  palette: (s) => s.primaryPalette,
  tone: (s) => {
    if (isFidelity(s)) return s.sourceColorHct.tone;
    if (isMonochrome(s)) return s.isDark ? 85 : 25;
    return s.isDark ? 30 : 90;
  },
  isBackground: true,
  background: (s) => highestSurface(s),
  contrastCurve: new ContrastCurve(1, 1, 3, 4.5),
  toneDeltaPair: () => new ToneDeltaPair(primaryContainer, primary, 10, 'nearer', false),
});
const onPrimaryContainer = ColorRole.fromPalette({
  name: 'on_primary_container',
  palette: (s) => s.primaryPalette,
  tone: (s) => {
    if (isFidelity(s)) return ColorRole.foregroundTone(primaryContainer.tone(s), 4.5);
    if (isMonochrome(s)) return s.isDark ? 0 : 100;
    return s.isDark ? 90 : 30;
  },
  background: () => primaryContainer,
  contrastCurve: new ContrastCurve(3, 4.5, 7, 11),
});
const inversePrimary = ColorRole.fromPalette({
  name: 'inverse_primary',
  palette: (s) => s.primaryPalette,
  tone: (s) => (s.isDark ? 40 : 80),
  background: () => inverseSurface,
  contrastCurve: new ContrastCurve(3, 4.5, 7, 7),
});

// ---- secondary ----
const secondary = ColorRole.fromPalette({
  name: 'secondary',
  palette: (s) => s.secondaryPalette,
  tone: (s) => (s.isDark ? 80 : 40),
  isBackground: true,
  background: (s) => highestSurface(s),
  contrastCurve: new ContrastCurve(3, 4.5, 7, 7),
  toneDeltaPair: () => new ToneDeltaPair(secondaryContainer, secondary, 10, 'nearer', false),
});
const onSecondary = ColorRole.fromPalette({
  name: 'on_secondary',
  palette: (s) => s.secondaryPalette,
  tone: (s) => (isMonochrome(s) ? (s.isDark ? 10 : 100) : s.isDark ? 20 : 100),
  background: () => secondary,
  contrastCurve: new ContrastCurve(4.5, 7, 11, 21),
});
const secondaryContainer = ColorRole.fromPalette({
  name: 'secondary_container',
  palette: (s) => s.secondaryPalette,
  tone: (s) => {
    const initialTone = s.isDark ? 30 : 90;
    if (isMonochrome(s)) return s.isDark ? 30 : 85;
    if (!isFidelity(s)) return initialTone;
    return findDesiredChromaByTone(
      s.secondaryPalette.hue,
      s.secondaryPalette.chroma,
      initialTone,
      !s.isDark,
    );
  },
  isBackground: true,
  background: (s) => highestSurface(s),
  contrastCurve: new ContrastCurve(1, 1, 3, 4.5),
  toneDeltaPair: () => new ToneDeltaPair(secondaryContainer, secondary, 10, 'nearer', false),
});
const onSecondaryContainer = ColorRole.fromPalette({
  name: 'on_secondary_container',
  palette: (s) => s.secondaryPalette,
  tone: (s) => {
    if (isMonochrome(s)) return s.isDark ? 90 : 10;
    if (!isFidelity(s)) return s.isDark ? 90 : 30;
    return ColorRole.foregroundTone(secondaryContainer.tone(s), 4.5);
  },
  background: () => secondaryContainer,
  contrastCurve: new ContrastCurve(3, 4.5, 7, 11),
});

// ---- tertiary ----
const tertiary = ColorRole.fromPalette({
  name: 'tertiary',
  palette: (s) => s.tertiaryPalette,
  tone: (s) => (isMonochrome(s) ? (s.isDark ? 90 : 25) : s.isDark ? 80 : 40),
  isBackground: true,
  background: (s) => highestSurface(s),
  contrastCurve: new ContrastCurve(3, 4.5, 7, 7),
  toneDeltaPair: () => new ToneDeltaPair(tertiaryContainer, tertiary, 10, 'nearer', false),
});
const onTertiary = ColorRole.fromPalette({
  name: 'on_tertiary',
  palette: (s) => s.tertiaryPalette,
  tone: (s) => (isMonochrome(s) ? (s.isDark ? 10 : 90) : s.isDark ? 20 : 100),
  background: () => tertiary,
  contrastCurve: new ContrastCurve(4.5, 7, 11, 21),
});
const tertiaryContainer = ColorRole.fromPalette({
  name: 'tertiary_container',
  palette: (s) => s.tertiaryPalette,
  tone: (s) => {
    if (isMonochrome(s)) return s.isDark ? 60 : 49;
    if (!isFidelity(s)) return s.isDark ? 30 : 90;
    const proposedHct = s.tertiaryPalette.getHct(s.sourceColorHct.tone);
    return fixIfDisliked(proposedHct).tone;
  },
  isBackground: true,
  background: (s) => highestSurface(s),
  contrastCurve: new ContrastCurve(1, 1, 3, 4.5),
  toneDeltaPair: () => new ToneDeltaPair(tertiaryContainer, tertiary, 10, 'nearer', false),
});
const onTertiaryContainer = ColorRole.fromPalette({
  name: 'on_tertiary_container',
  palette: (s) => s.tertiaryPalette,
  tone: (s) => {
    if (isMonochrome(s)) return s.isDark ? 0 : 100;
    if (!isFidelity(s)) return s.isDark ? 90 : 30;
    return ColorRole.foregroundTone(tertiaryContainer.tone(s), 4.5);
  },
  background: () => tertiaryContainer,
  contrastCurve: new ContrastCurve(3, 4.5, 7, 11),
});

// ---- error ----
const error = ColorRole.fromPalette({
  name: 'error',
  palette: (s) => s.errorPalette,
  tone: (s) => (s.isDark ? 80 : 40),
  isBackground: true,
  background: (s) => highestSurface(s),
  contrastCurve: new ContrastCurve(3, 4.5, 7, 7),
  toneDeltaPair: () => new ToneDeltaPair(errorContainer, error, 10, 'nearer', false),
});
const onError = ColorRole.fromPalette({
  name: 'on_error',
  palette: (s) => s.errorPalette,
  tone: (s) => (s.isDark ? 20 : 100),
  background: () => error,
  contrastCurve: new ContrastCurve(4.5, 7, 11, 21),
});
const errorContainer = ColorRole.fromPalette({
  name: 'error_container',
  palette: (s) => s.errorPalette,
  tone: (s) => (s.isDark ? 30 : 90),
  isBackground: true,
  background: (s) => highestSurface(s),
  contrastCurve: new ContrastCurve(1, 1, 3, 4.5),
  toneDeltaPair: () => new ToneDeltaPair(errorContainer, error, 10, 'nearer', false),
});
const onErrorContainer = ColorRole.fromPalette({
  name: 'on_error_container',
  palette: (s) => s.errorPalette,
  tone: (s) => (isMonochrome(s) ? (s.isDark ? 90 : 10) : s.isDark ? 90 : 30),
  background: () => errorContainer,
  contrastCurve: new ContrastCurve(3, 4.5, 7, 11),
});

/** The full set of Bloom colour roles, keyed by name. Resolve via `.getArgb(scheme)`. */
export const Roles = {
  primaryPaletteKeyColor,
  secondaryPaletteKeyColor,
  tertiaryPaletteKeyColor,
  neutralPaletteKeyColor,
  neutralVariantPaletteKeyColor,
  background,
  onBackground,
  surface,
  surfaceDim,
  surfaceBright,
  surfaceContainerLowest,
  surfaceContainerLow,
  surfaceContainer,
  surfaceContainerHigh,
  surfaceContainerHighest,
  onSurface,
  surfaceVariant,
  onSurfaceVariant,
  inverseSurface,
  inverseOnSurface,
  outline,
  outlineVariant,
  shadow,
  scrim,
  surfaceTint,
  primary,
  onPrimary,
  primaryContainer,
  onPrimaryContainer,
  inversePrimary,
  secondary,
  onSecondary,
  secondaryContainer,
  onSecondaryContainer,
  tertiary,
  onTertiary,
  tertiaryContainer,
  onTertiaryContainer,
  error,
  onError,
  errorContainer,
  onErrorContainer,
} as const;

export type RoleName = keyof typeof Roles;
