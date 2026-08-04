/**
 * Bloom colour policy — how a seed becomes the visible token set.
 *
 * The engine (`color-engine/`) answers "what colours exist around this seed".
 * This module answers the separate question of how deep, how loud and how far
 * apart they should be, which canonical Material 3 answers differently than
 * Bloom needs:
 *
 * - M3 puts `primary` at tone 80 in dark so it can be used as TEXT. Bloom uses
 *   `--primary` as a FILL (buttons, FABs, the user's own chat bubble), and tone
 *   80 collapses chroma — the reason the whole palette read pastel. The two jobs
 *   are split here: `--primary` is the fill, `--primary-text` is the accent
 *   legible as text on the page.
 * - M3's supporting accents rotate 18–35 degrees off the seed, so the
 *   primary/secondary/tertiary trio lands in one hue family and cannot encode
 *   anything. A real split-complementary rotation fixes that.
 * - Chroma has to scale inversely with the area a colour paints: a chip's
 *   background covers far more pixels than its label.
 *
 * The single rule underneath every decision here is that **light and dark want
 * opposite things**. On a near-white page a fill must go deep to read calm; on a
 * near-black one it must stay bright or it turns to mud. Every asymmetry below
 * is that rule applied to one more role.
 */
import { argbFromHex, type RoleColors } from './color-engine';
import { APP_COLOR_PRESETS, HEX_TO_APP_COLOR } from './color-presets';
import { Hct } from './color-engine/hct';
import { TonalPalette } from './color-engine/tonal-palette';
import { blueFromArgb, greenFromArgb, redFromArgb } from './color-engine/color-utils';

/** Semantic status seeds. Only hue and chroma survive; tones come from the policy. */
export const STATUS_SEEDS = {
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
} as const;

/** Optional real accent colours — e.g. the 2nd and 3rd seeds extracted from artwork. */
export interface PinnedAccents {
  secondary?: string;
  tertiary?: string;
}

/** The tokens the policy owns. Everything else keeps coming from the M3 roles. */
export type PolicyTokens = Record<string, string>;

const AA = 4.5;

const rgb = (argb: number): string =>
  `rgb(${redFromArgb(argb)} ${greenFromArgb(argb)} ${blueFromArgb(argb)})`;

/**
 * A translucent tint, as `rgba(r, g, b, a)`.
 *
 * Deliberately the legacy comma form: React Native's colour parser accepts it on
 * every platform, while the modern `rgb(r g b / a)` slash syntax is a web-only
 * spelling.
 */
const rgba = (argb: number, alpha: number): string =>
  `rgba(${redFromArgb(argb)}, ${greenFromArgb(argb)}, ${blueFromArgb(argb)}, ${alpha})`;

/**
 * WCAG contrast of a QUANTIZED colour against white or black.
 *
 * The engine's tone-based ratio is continuous, but what ships is an 8-bit colour
 * whose rounding turns a nominal 4.50 into a measured 4.49 — below AA. Every
 * legibility decision here reads the colour that actually renders.
 */
function contrastOf(argb: number, onWhite: boolean): number {
  const channel = (v: number): number => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const luminance =
    0.2126 * channel(redFromArgb(argb)) +
    0.7152 * channel(greenFromArgb(argb)) +
    0.0722 * channel(blueFromArgb(argb));
  return onWhite ? 1.05 / (luminance + 0.05) : (luminance + 0.05) / 0.05;
}

/**
 * White and black are never both legible on the same fill — white needs a
 * light-enough one, black a dark-enough one, and they overlap in a single tone.
 * So the foreground is not a preference: the fill's tone already decided it. The
 * one overlapping tone goes to white, because landing there is the entire point
 * of a deep fill.
 */
const foregroundFor = (argb: number): string =>
  contrastOf(argb, true) >= AA ? 'rgb(255 255 255)' : 'rgb(0 0 0)';

const noLegibleForeground = (argb: number): boolean =>
  contrastOf(argb, true) < AA && contrastOf(argb, false) < AA;

/** The tone a white-label fill sits at in LIGHT mode. */
const FILL_TONE_FLOOR = 45;

/** The tone a white-label fill sits at in DARK: the ceiling white text allows. */
const FILL_TONE_SEARCH_CEILING = 56;

/**
 * How much DEEPER the same brand sits on a light page than on a dark one.
 *
 * Not decoration: a colour on a near-white page has nothing to read against, so
 * the mode difference is what makes a theme a theme rather than one palette shown
 * twice. Dropping it is a regression that looks like a simplification — light and
 * dark collapse onto the same fill for every seed that is not already bright, and
 * the two modes stop being distinguishable at all.
 */
const LIGHT_DEPTH_STEP = 5;

/**
 * How deep a light-mode fill may go. Deliberately BELOW the search's lower bound,
 * which those two used to share — and sharing them silently voided the depth step
 * for any seed whose dark fill already sits at that bound. A high-chroma seed is
 * exactly that case: pink loses its white label above tone 45, so dark cannot rise
 * to make room and light must descend instead, or the two modes render the
 * identical fill.
 */
const LIGHT_FILL_FLOOR = 40;

/** How far a fill may be dragged from its natural tone before the colour is lost. */
const TONE_BUDGET = 25;

/** No dark-mode BRAND fill sits below this: under it a colour goes heavy on black. */
const DARK_SEED_FLOOR = 58;

/**
 * No dark-mode ACCENT sits below this. Some hues peak dark — violet at tone 33 —
 * and rendering one there gives a slab rather than a highlight.
 */
const DARK_ACCENT_FLOOR = 58;

/**
 * Accent fills sit at their hue's PEAK tone in dark — where the hue is most
 * itself, so a lime reads as lime rather than olive.
 *
 * The cost is fixed and cannot be engineered away: peaks for that family live
 * around tone 88, and white text needs a fill at or below 49, so these buttons
 * carry a BLACK label. Capping the tone to win the white label back turns the
 * same accents dull — measured on blue, rgb(252 220 0) becomes rgb(134 116 0).
 * The bright colour is the deliberate choice.
 */

/** Chroma ceiling for an accent FILL — the brand palette's own maximum, not the gamut's. */
const ACCENT_CHROMA = 80;

/** The text/icon member: small enough that saturation costs nothing. */
const TEXT_TONE = { light: 40, dark: 80 } as const;
const TEXT_CHROMA = 60;

/** The `-subtle` tint is mixed from a BRIGHT tone at low alpha, never a dark one at high alpha. */
const SUBTLE_SOURCE_TONE = 60;
const SUBTLE_ALPHA = { light: 0.13, dark: 0.24 } as const;

/**
 * A seed at or below this chroma has no colour to derive from, so the whole
 * palette goes greyscale — the black-and-white theme. Keyed on the seed rather
 * than on a flag, so picking any grey in a colour wheel lands there too instead
 * of on a nearly-grey approximation of it.
 */
const MONOCHROME_MAX_CHROMA = 6;

/**
 * Whether a seed carries no colour to derive a theme from — the one authority for
 * that question, so the policy and the scheme choice can never disagree about a
 * given seed and produce a grey palette wearing chromatic surfaces.
 */
export function isColourlessSeed(seedHex: string): boolean {
  return Hct.fromInt(argbFromHex(seedHex)).chroma <= MONOCHROME_MAX_CHROMA;
}

/** Where a monochrome brand fill sits: near-black on a white page, near-white on a black one. */
const MONOCHROME_FILL_TONE = { light: 12, dark: 94 } as const;

/** The quiet member of a monochrome trio — the only one that is actually grey. */
const MONOCHROME_SECONDARY_TONE = { light: 36, dark: 72 } as const;

/** Split-complementary: the two accents sit either side of the seed's complement. */
const SPLIT_ROTATIONS = [150, 210] as const;

/** How far the standout accent may move toward a more vivid hue, and the gain that earns it. */
const VIVID_SNAP_WINDOW = 25;
const VIVID_SNAP_MIN_GAIN = 15;

/** Below this the split pair stops reading as a pair, so a snap that crowds it is abandoned. */
const MIN_ACCENT_SEPARATION = 25;

/** A standout accent this close to the error hue reads as "delete", not "create". */
const DESTRUCTIVE_PROXIMITY = 30;

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

/**
 * The tone at which a hue reaches its highest chroma in sRGB — where it is most
 * itself.
 *
 * It varies enormously by family: red and orange peak near tone 55, violet near
 * 33, while lime, green and cyan only peak above 85. A single tone for every hue
 * therefore reads right for some and as mud for others — lime at tone 49 is
 * olive, and it takes tone 89 to look like lime at all.
 */
function peakTone(hue: number): number {
  const palette = TonalPalette.fromHueAndChroma(hue, 200);
  let bestTone = 50;
  let bestChroma = -1;
  for (let tone = 30; tone <= 92; tone += 1) {
    const chroma = Hct.fromInt(palette.tone(tone)).chroma;
    if (chroma > bestChroma) {
      bestChroma = chroma;
      bestTone = tone;
    }
  }
  return bestTone;
}

/** How vivid a hue can get at all — its chroma at its peak tone. */
function peakChroma(hue: number): number {
  return Hct.fromInt(TonalPalette.fromHueAndChroma(hue, 200).tone(peakTone(hue))).chroma;
}

/**
 * Nudge a hue to the most vivid one near it, but only when that is a real gain.
 *
 * The sRGB gamut is not a circle, so a rotation can land in a genuinely dull
 * pocket: from a magenta seed the +150 arm falls on hue 113, which peaks at
 * chroma 74 and reads as acid yellow, while hue 138 twenty-five degrees away
 * peaks at 101 and is the lime it was supposed to be. The threshold keeps this
 * from becoming a free-for-all — the same search would drift a well-placed pink
 * to magenta for four points, which is noise.
 */
function vividHueNear(hue: number): number {
  const baseChroma = peakChroma(hue);
  let bestHue = hue;
  let bestChroma = baseChroma;
  for (let delta = -VIVID_SNAP_WINDOW; delta <= VIVID_SNAP_WINDOW; delta += 1) {
    const candidate = (((hue + delta) % 360) + 360) % 360;
    const chroma = peakChroma(candidate);
    if (chroma > bestChroma) {
      bestChroma = chroma;
      bestHue = candidate;
    }
  }
  return bestChroma - baseChroma >= VIVID_SNAP_MIN_GAIN ? bestHue : hue;
}

/**
 * Whether the seed IS a built-in brand that declares a white label.
 *
 * Derived from the hex rather than passed in, and that is the point: a named
 * preset is a fixed seed fed through this same policy, so
 * `buildSeedScopeVars({ seed: preset.hex })` has to reproduce the preset exactly
 * — a contract the seed-scope and build-theme-from-seed parity suites assert for
 * every preset in both modes. Threading the declaration as a parameter satisfied
 * only the caller that knew about it and silently gave every other path a
 * different yellow.
 */
function declaresWhiteLabel(seedHex: string): boolean {
  const name = HEX_TO_APP_COLOR[seedHex.toLowerCase()];
  return name !== undefined && APP_COLOR_PRESETS[name].label === 'white';
}

/**
 * The most vivid tone a palette reaches while a WHITE label still clears AA on
 * it — searched per HUE instead of assumed.
 *
 * A single tone for every hue leaves chroma on the table for some and takes it
 * from others, because the sRGB gamut is not a cylinder: from tone 45 upward an
 * orange keeps gaining chroma until white runs out at ~49.5 (59 -> 84), while a
 * violet has already passed its peak and LOSES chroma over the same interval
 * (91 -> 86). The old flat 45 spent none of the contrast headroom it had — every
 * preset sat at 5.38 when 4.5 was the requirement — and orange paid for that
 * twice, since its hue is also one of the gamut's narrow ones.
 *
 * The floor is what keeps this from trading lightness for chroma: a hue that
 * peaks far below 45 stays at 45 rather than descending into a near-black slab
 * that happens to be saturated. So the search can only ever improve a fill or
 * leave it exactly where it was.
 *
 * Contrast is measured on the QUANTIZED colour, not the engine's continuous
 * tone-ratio: an earlier iteration chose tones by the latter and shipped 135
 * pairs at a measured 4.49.
 */
function vividLegibleTone(palette: TonalPalette): number {
  let bestTone = FILL_TONE_FLOOR;
  let bestChroma = -1;
  for (let tone = FILL_TONE_FLOOR; tone <= FILL_TONE_SEARCH_CEILING; tone += 0.5) {
    const argb = palette.tone(tone);
    if (contrastOf(argb, true) < AA) continue;
    const chroma = Hct.fromInt(argb).chroma;
    // A tie keeps the DEEPEST tone. Ties are common rather than exotic — any seed
    // whose chroma sits below the gamut ceiling across this whole range has a flat
    // curve here — and breaking them toward the lightest end instead changes no
    // preset's output, because the light-mode floor below already supplies the
    // separation that would have bought. Mutation-checked, not assumed.
    if (chroma > bestChroma) {
      bestChroma = chroma;
      bestTone = tone;
    }
  }
  return bestTone;
}

/**
 * The tone a BRAND fill sits at.
 *
 * Normally the ceiling white text allows, so a Follow button, an avatar and the
 * compose button all carry a white label. But a seed that is ALREADY light —
 * yellow at tone 82, faircoin at 90 — cannot be dragged down there without
 * ceasing to be itself: yellow turns to brown and lime to moss. Those keep their
 * own tone and take a black label instead, which is what a bright yellow button
 * wants anyway. The 25-tone budget is what separates the two cases, and it is
 * why 11 of the 13 chromatic presets carry white and exactly the two light ones
 * do not. (`mono` sits outside this rule — see MONOCHROME_FILL_TONE.)
 */
function whiteLabelTone(
  palette: TonalPalette,
  seedTone: number,
  isDark: boolean,
  forceWhite: boolean,
): number {
  // LIGHT: every fill comes down, no exemption. On a near-white page a bright
  // colour has nothing to read against — a lime at its own tone 90 is a pale
  // smear there, indistinguishable from the same colour in dark, which is not a
  // theme at all. Coming down is what makes faircoin a deep green in light and a
  // bright lime in dark.
  if (!isDark) return Math.max(LIGHT_FILL_FLOOR, vividLegibleTone(palette) - LIGHT_DEPTH_STEP);
  // DARK: the budget applies. Most brands come down to where white fits, but a
  // seed that is already light cannot without ceasing to be itself, so it keeps
  // its own tone and takes a black label. That is the eleven-and-two pattern.
  // A brand that DECLARES a white label forgoes the exemption outright: it comes
  // down to where white fits, exactly as it does in light. Without this the
  // budget is the only voice, and it answers by seed lightness alone — which
  // cannot separate a yellow that wants to be a deep gold from a lime that wants
  // to stay bright.
  const candidate = forceWhite
    ? vividLegibleTone(palette)
    : Math.max(vividLegibleTone(palette), seedTone - TONE_BUDGET);
  return contrastOf(palette.tone(candidate), true) >= AA
    ? candidate
    : Math.max(seedTone, DARK_SEED_FLOOR);
}

/**
 * The same budget governs the ACCENT: come down to where white fits, unless the
 * descent would cost more than this and destroy the hue. An accent that peaks
 * bright — a lime at tone 88 — keeps its peak and takes a black label; one that
 * peaks dark comes down and carries white.
 */
function accentTone(hue: number, isDark: boolean): number {
  const palette = TonalPalette.fromHueAndChroma(hue, ACCENT_CHROMA);
  if (!isDark) return Math.max(LIGHT_FILL_FLOOR, vividLegibleTone(palette) - LIGHT_DEPTH_STEP);
  const peak = Math.max(peakTone(hue), DARK_ACCENT_FLOOR);
  const candidate = Math.max(vividLegibleTone(palette), peak - TONE_BUDGET);
  return contrastOf(palette.tone(candidate), true) >= AA ? candidate : peak;
}

/** Settle a fill tone so some foreground is legible, then pair it with that foreground. */
function fillPair(palette: TonalPalette, startTone: number): { fill: string; foreground: string } {
  let tone = startTone;
  while (noLegibleForeground(palette.tone(tone)) && tone > 1 && tone < 99) {
    tone += tone < 50 ? -1 : 1;
  }
  return { fill: rgb(palette.tone(tone)), foreground: foregroundFor(palette.tone(tone)) };
}

/**
 * Pick the two accent hues: which arm of the split becomes the STANDOUT one
 * (`tertiary` — the FAB, the compose button) and which stays quiet.
 *
 * A split pair is symmetric about the complement, but the two arms are not
 * equally vivid, because the gamut is not a circle. The louder role takes
 * whichever arm can reach more chroma, then that arm alone is allowed to drift
 * toward a more vivid neighbour. Only the standout moves: snapping both can pull
 * them onto the same pocket, which collapses the pair and leaves the destructive
 * check below with nothing to swap to.
 */
function accentHues(seedHue: number): { secondary: number; tertiary: number } {
  const [firstRotation, secondRotation] = SPLIT_ROTATIONS;
  const geometricA = (seedHue + firstRotation) % 360;
  const geometricB = (seedHue + secondRotation) % 360;

  const geometricStandout =
    peakChroma(geometricA) >= peakChroma(geometricB) ? geometricA : geometricB;
  const quiet = geometricStandout === geometricA ? geometricB : geometricA;
  const snapped = vividHueNear(geometricStandout);
  const standout =
    hueDistance(snapped, quiet) >= MIN_ACCENT_SEPARATION ? snapped : geometricStandout;

  // A call to action must not be mistaken for a destructive one. When the loud
  // arm lands near the error hue the two trade places, which keeps the split
  // pair intact instead of inventing a third rotation.
  const errorHue = Hct.fromInt(argbFromHex(STATUS_SEEDS.error)).hue;
  return hueDistance(standout, errorHue) < DESTRUCTIVE_PROXIMITY
    ? { secondary: standout, tertiary: quiet }
    : { secondary: quiet, tertiary: standout };
}

/**
 * Build the policy-owned tokens for a seed and mode.
 *
 * `roles` is the engine's `vivid` role set for the same seed and mode, passed in
 * so the caller does not generate it twice — the surface scale and
 * `--primary-text` come straight from it.
 */
export function buildPolicyTokens(
  seedHex: string,
  isDark: boolean,
  roles: RoleColors,
  pinned: PinnedAccents = {},
): PolicyTokens {
  const seed = Hct.fromInt(argbFromHex(seedHex));

  // Max chroma at a tone that carries a WHITE label, in both modes.
  //
  // The brand fill is what a compose button, a Follow button, an avatar and the
  // user's own chat bubble paint with, and those carry white text. White needs
  // tone <= 49, so that is the ceiling — in dark as much as in light. Letting the
  // dark fill sit at the seed's own tone instead makes it brighter, but every one
  // of those labels turns black, which costs more than the brightness buys.
  const monochrome = seed.chroma <= MONOCHROME_MAX_CHROMA;
  // BOTH modes key off the seed itself, so the fill carries the brand's SATURATION
  // as well as its hue. Light used to force the hue to maximum chroma, which reads
  // as "the seed only chose a hue" — and that silently renames a colour: a muted
  // blue-grey seed resolved to a vivid cyan, and a brown seed to an orange, since
  // both differ from a saturated neighbour by chroma alone. A deliberately soft
  // brand now stays soft instead of being argued with.
  // A monochrome seed has no chroma to preserve either way, and its fill goes to
  // the far end of the scale rather than the white-label ceiling: a mid-grey
  // button reads as disabled, where near-black on white reads as the primary
  // action.
  const brandPalette = monochrome
    ? TonalPalette.fromHueAndChroma(0, 0)
    : TonalPalette.fromInt(argbFromHex(seedHex));
  const primary = fillPair(
    brandPalette,
    monochrome
      ? (isDark ? MONOCHROME_FILL_TONE.dark : MONOCHROME_FILL_TONE.light)
      : whiteLabelTone(brandPalette, seed.tone, isDark, declaresWhiteLabel(seedHex)),
  );

  const tokens: PolicyTokens = {
    '--primary': primary.fill,
    '--primary-foreground': primary.foreground,
    // The accent legible as TEXT on the page surface — the job M3's `primary`
    // does correctly, and which the fill must stop trying to do at the same time.
    '--primary-text': roles.primary,
    '--primary-subtle': rgba(
      TonalPalette.fromHueAndChroma(seed.hue, monochrome ? 0 : 200).tone(SUBTLE_SOURCE_TONE),
      isDark ? SUBTLE_ALPHA.dark : SUBTLE_ALPHA.light,
    ),
    '--ring': roles.primary,
    // `--card` is the one surface MAPPING the policy changes.
    // `surfaceContainerLowest` is M3's RECESSED step: in dark it sits at tone 4
    // against a tone-6 background, so every card, sheet and chat bubble sinks
    // into the page instead of lifting off it. Light is unaffected — lowest IS
    // the lightest there — so only dark moves.
    '--card': isDark ? roles.surfaceContainer : roles.surfaceContainerLowest,
    // A touch darker than M3's page background: near-white reads as unfinished
    // next to the card, and the extra step gives the surface ramp somewhere to sit.
    '--background': rgb(
      TonalPalette.fromHueAndChroma(seed.hue, monochrome ? 0 : 10).tone(isDark ? 4 : 96),
    ),
    // `--accent` stays what every consumer actually uses it for: a hover surface.
    '--accent': roles.surfaceContainerHigh,
    '--accent-foreground': roles.onSurfaceVariant,
  };

  const hues = accentHues(seed.hue);
  for (const role of ['secondary', 'tertiary'] as const) {
    const pin = pinned[role];
    const hue = pin !== undefined ? Hct.fromInt(argbFromHex(pin)).hue : hues[role];
    // One hue, three palettes. Every member shares it, so the family still reads
    // as one colour; only how loudly each speaks differs.
    // A monochrome theme has no accents to rotate to; the trio becomes a ladder
    // of greys, which still separates a standout button from a quiet one.
    const fillPalette = TonalPalette.fromHueAndChroma(hue, monochrome ? 0 : ACCENT_CHROMA);
    const textPalette = TonalPalette.fromHueAndChroma(hue, monochrome ? 0 : TEXT_CHROMA);
    const vividPalette = TonalPalette.fromHueAndChroma(hue, monochrome ? 0 : 200);
    // DARK sits at the hue's peak tone, floored by the same rule the brand fill
    // uses: some hues peak dark (violet at 35), and rendering them there gives a
    // slab rather than a highlight. LIGHT goes deep like every other fill, but
    // that is exactly the tone where a yellow-green turns to bile, so the
    // analyzer runs there — Bloom ships it yet only reaches it on the fidelity
    // path, which no Bloom variant uses, so a rotated accent could land in the
    // band with nothing to lift it out.
    // Bloom's own tone policy governs this, and M3's `fixIfDisliked` deliberately
    // does not get a say. That heuristic flags dark yellow-greens and lifts them
    // to tone 70 — a remedy calibrated for M3's tone assignments, where nothing
    // depends on staying under the ceiling white text needs. Here everything does:
    // a 25-tone lift puts the fill above it and flips a compose button's label to
    // black. The accent chroma cap already keeps these hues out of neon territory,
    // and the hue itself is the caller's brand rather than ours to move. The
    // analyzer still runs where it was designed to, inside `color-roles`.
    // Monochrome keeps `tertiary` AT the brand fill rather than a step off it:
    // tertiary is what a compose button and a FAB paint with, and those are the
    // primary action — a step of grey between them and `primary` reads as two
    // buttons disagreeing, not as hierarchy. `secondary` carries the whole
    // demotion instead.
    const tone = monochrome
      ? role === 'tertiary'
        ? isDark
          ? MONOCHROME_FILL_TONE.dark
          : MONOCHROME_FILL_TONE.light
        : isDark
          ? MONOCHROME_SECONDARY_TONE.dark
          : MONOCHROME_SECONDARY_TONE.light
      : accentTone(hue, isDark);
    const pair = fillPair(fillPalette, tone);
    tokens[`--${role}`] = pair.fill;
    tokens[`--${role}-foreground`] = pair.foreground;
    tokens[`--${role}-text`] = rgb(textPalette.tone(isDark ? TEXT_TONE.dark : TEXT_TONE.light));
    tokens[`--${role}-subtle`] = rgba(
      vividPalette.tone(SUBTLE_SOURCE_TONE),
      isDark ? SUBTLE_ALPHA.dark : SUBTLE_ALPHA.light,
    );
  }

  // Categorical chart ramp: five hues spread evenly from the seed at one tone.
  // The old ramp drew all five from the primary/secondary/tertiary trio, which
  // spans ~35 degrees, so adjacent series were indistinguishable.
  for (let i = 0; i < 5; i += 1) {
    // Greyscale charts spread by TONE instead of hue — the only axis left.
    tokens[`--chart-${i + 1}`] = monochrome
      ? rgb(TonalPalette.fromHueAndChroma(0, 0).tone(isDark ? 40 + i * 13 : 78 - i * 13))
      : rgb(TonalPalette.fromHueAndChroma((seed.hue + i * 72) % 360, 60).tone(isDark ? 72 : 48));
  }

  // The status family, themed per mode. The four frozen hexes it replaces all
  // FAIL AA under white text — warning at 2.15, success 2.54, info 3.68, error
  // 3.76 — and had no subtle or text member, so every status pill in the
  // ecosystem was either illegible or hand-rolled.
  for (const [role, hex] of Object.entries(STATUS_SEEDS)) {
    const status = Hct.fromInt(argbFromHex(hex));
    const palette = TonalPalette.fromHueAndChroma(status.hue, status.chroma);
    const pair = fillPair(
      palette,
      isDark
        ? vividLegibleTone(palette)
        : Math.max(LIGHT_FILL_FLOOR, vividLegibleTone(palette) - LIGHT_DEPTH_STEP),
    );
    tokens[`--${role}`] = pair.fill;
    tokens[`--${role}-foreground`] = pair.foreground;
    tokens[`--${role}-text`] = rgb(
      TonalPalette.fromHueAndChroma(status.hue, TEXT_CHROMA).tone(
        isDark ? TEXT_TONE.dark : TEXT_TONE.light,
      ),
    );
    // Mixed from the seed's OWN tone and chroma — for error that reproduces
    // #EF4444 exactly, the bright red consumers were hand-tinting with
    // `theme.colors.error + '15'`, which only worked because that token was a
    // flat hex and produced an opaque slab on any `rgb(...)` one.
    tokens[`--${role}-subtle`] = rgba(
      palette.tone(status.tone),
      isDark ? SUBTLE_ALPHA.dark : SUBTLE_ALPHA.light,
    );
  }

  return tokens;
}
