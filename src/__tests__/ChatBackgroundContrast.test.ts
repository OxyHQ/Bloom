/**
 * @jest-environment node
 *
 * What the chat wallpaper is allowed to do to legibility, measured.
 *
 * THE CLAIM BEING TESTED IS NARROW ON PURPOSE. A bubble is an OPAQUE fill, so
 * its own label contrast is a property of the bubble and not of the wallpaper —
 * asserting "text over the wallpaper clears AA" would be measuring a composite
 * that never gets painted. What a wallpaper CAN do is stop a bubble being told
 * apart from the page behind it, so the number here is the SEPARATION between a
 * bubble fill and the wallpaper. Endpoint samples describe the generated
 * bounds, but do NOT prove a worst-case guarantee over continuous image
 * pixels: an intermediate pixel may equal the bubble luminance. The image
 * limitation is measured separately below, while opaque label AA remains.
 *
 * The figures are pinned as EQUALITIES, not floors. A wallpaper that quietly
 * improves is a wallpaper whose recipe changed, and that is exactly as much of
 * an event as one that regresses — the day a `patternOpacity` or a ramp step
 * moves, this file says so in either direction rather than absorbing it.
 *
 * SUBSET, AND WHY. The preset registry has 64 entries; a sweep over all of them
 * kills the jest worker in this environment with
 * `Context::GetNumberOfEmbedderDataFields Not a native context` — the same
 * V8/contextify fault `AGENTS.md` records for `glass-colors` and
 * `color-preset-registry`, reproducible here on `main` and on `accent-colors`
 * too. So the sweep is the 16 named below: the ten hue families plus the two
 * achromatic presets and four of the generated pairs. Named rather than sliced,
 * so a registry reorder cannot silently change what was measured.
 */
import { resolveButtonRamps } from '../button/shared';
import {
  chatBackgroundExtremes,
  chatBackgroundReferenceSurfaces,
  resolveChatScreenPaint,
} from '../chat-screen/shared';
import type { ChatBackgroundVariant } from '../chat-screen/types';
import { contrastRatio, relativeLuminance } from '../styles/color-contrast';
import { buildTheme } from '../theme/build-theme';
import { APP_COLOR_PRESETS, type AppColorName } from '../theme/color-presets';
import { mixColor } from '../button/shared';

const PRESETS = [
  'oxy',
  'blue',
  'teal',
  'green',
  'yellow',
  'red',
  'purple',
  'pink',
  'orange',
  'mono',
  'gray',
  'navy',
  'forest-fire',
  'midnight-citrus',
  'charcoal-lime',
  'amethyst-current',
] as AppColorName[];

const VARIANTS: ChatBackgroundVariant[] = ['plain', 'pattern', 'gradient', 'image'];

const THEMES = PRESETS.flatMap((preset) =>
  (['light', 'dark'] as const).map((mode) => ({ id: `${preset}/${mode}`, theme: buildTheme(preset, mode) })),
);

const round = (n: number) => Number(n.toFixed(2));

function separation(
  paint: ReturnType<typeof resolveChatScreenPaint>,
  variant: ChatBackgroundVariant,
): number {
  const ex = chatBackgroundExtremes(paint, variant);
  return Math.min(
    ...chatBackgroundReferenceSurfaces(paint).flatMap((surface) => [
      contrastRatio(surface, ex.lightest),
      contrastRatio(surface, ex.darkest),
    ]),
  );
}

describe('the sweep is real', () => {
  it('names presets that EXIST — a typo would measure an empty set', () => {
    const registry = new Set(Object.keys(APP_COLOR_PRESETS));
    expect(PRESETS.filter((preset) => !registry.has(preset))).toEqual([]);
    expect(THEMES).toHaveLength(32);
  });

  it('measures two DIFFERENT bubble fills per theme', () => {
    // Vacuity floor: if the incoming and outgoing references collapsed onto one
    // colour, every separation below would be half a measurement and nothing
    // would say so.
    for (const { id, theme } of THEMES) {
      const surfaces = chatBackgroundReferenceSurfaces(resolveChatScreenPaint(theme));
      expect(new Set(surfaces).size).toBe(2);
      expect(surfaces.every((s) => /^(#|rgb)/.test(s))).toBe(true);
      expect(id).toBeTruthy();
    }
  });
});

describe('bubble text over its own fill', () => {
  it('clears AAA for an incoming bubble and AA for an outgoing one, in every theme', () => {
    let incoming = Infinity;
    let outgoing = Infinity;
    let worstOutgoing = '';
    for (const { id, theme } of THEMES) {
      const paint = resolveChatScreenPaint(theme);
      const { accent } = resolveButtonRamps(theme);
      incoming = Math.min(incoming, contrastRatio(paint.text, paint.surface));
      const out = contrastRatio(theme.colors.primaryForeground, theme.colors.primary);
      if (out < outgoing) {
        outgoing = out;
        worstOutgoing = id;
      }
    }
    // Literals, not ratios derived from the same paint: a floor computed from
    // the thing under test moves with it and measures nothing.
    expect(round(incoming)).toBe(9.47);
    expect(incoming).toBeGreaterThanOrEqual(7);
    expect(round(outgoing)).toBe(4.55);
    expect(outgoing).toBeGreaterThanOrEqual(4.5);
    expect(worstOutgoing).toBe('yellow/dark');
  });

  it('keeps the floating pill legible in every theme', () => {
    let worst = Infinity;
    for (const { theme } of THEMES) {
      const paint = resolveChatScreenPaint(theme);
      worst = Math.min(worst, contrastRatio(paint.textSecondary, paint.floatingSurface));
    }
    expect(round(worst)).toBe(8.84);
    expect(worst).toBeGreaterThanOrEqual(4.5);
  });
});

describe('bubble separation from each wallpaper', () => {
  const measured: Record<ChatBackgroundVariant, [min: number, max: number]> = {
    plain: [1.10, 1.57],
    pattern: [1.10, 1.57],
    gradient: [1.10, 1.57],
    image: [1.17, 1.65],
  };

  for (const variant of VARIANTS) {
    it(`${variant}: the range is exactly what was measured`, () => {
      const values = THEMES.map(({ theme }) => separation(resolveChatScreenPaint(theme), variant));
      expect([round(Math.min(...values)), round(Math.max(...values))]).toEqual(measured[variant]);
    });
  }

  it('never lets generated pattern/gradient endpoints separate WORSE than the bare page', () => {
    // The page colour is the baseline every chat screen already has. A variant
    // that dips under it is a wallpaper that made the transcript harder to read
    // than no wallpaper at all — which is the whole failure mode.
    for (const { id, theme } of THEMES) {
      const paint = resolveChatScreenPaint(theme);
      const baseline = separation(paint, 'plain');
      for (const variant of ['plain', 'pattern', 'gradient'] as const) {
        const value = separation(paint, variant);
        expect({ at: `${id} ${variant}`, value: round(value) }).toEqual({
          at: `${id} ${variant}`,
          value: expect.any(Number) as unknown as number,
        });
        expect(round(value)).toBeGreaterThanOrEqual(round(baseline));
      }
    }
  });

  it('records the visible-photo limitation instead of claiming endpoint contrast covers every pixel', () => {
    const worseEndpoints: string[] = [];
    const overlappingRanges: string[] = [];
    for (const { id, theme } of THEMES) {
      const paint = resolveChatScreenPaint(theme);
      if (separation(paint, 'image') < separation(paint, 'plain')) worseEndpoints.push(id);
      const ex = chatBackgroundExtremes(paint, 'image');
      const low = relativeLuminance(ex.darkest)!;
      const high = relativeLuminance(ex.lightest)!;
      if (chatBackgroundReferenceSurfaces(paint).some(fill => {
        const value = relativeLuminance(fill)!;
        return value >= low && value <= high;
      })) overlappingRanges.push(id);
      // Keep the photograph visible; a near-opaque overlay would fake the
      // original stronger-than-page assertion by eliminating the image.
      expect(paint.imageDimOpacity).toBe(theme.isDark ? 0.62 : 0.55);
    }
    expect(worseEndpoints).toEqual(['yellow/dark']);
    // Inside this continuous range a photo can equal a bubble's luminance:
    // separation1.00 is possible even when both endpoint samples are >1.
    expect(overlappingRanges).toEqual([
      'oxy/dark', 'blue/dark', 'teal/dark', 'green/dark', 'yellow/dark',
      'red/dark', 'purple/dark', 'pink/dark', 'orange/dark', 'mono/dark',
      'gray/dark', 'navy/dark', 'forest-fire/dark', 'midnight-citrus/dark',
      'charcoal-lime/dark', 'amethyst-current/dark',
    ]);
  });

  it('NEGATIVE CONTROL: dimming toward pure white collapses the light-mode image case to 1.00', () => {
    // The first version of `imageDim` was `#ffffff` / `#000000`. It reads as the
    // obvious choice and it is the bug: white dimmed toward white IS white, which
    // is the card colour, so a white incoming bubble over a bright photo has no
    // edge at all. Kept as a control so the fix cannot be undone by someone who
    // thinks the neutral step is arbitrary.
    let worst = Infinity;
    for (const { theme } of THEMES) {
      const paint = { ...resolveChatScreenPaint(theme), imageDim: theme.isDark ? '#000000' : '#ffffff' };
      worst = Math.min(worst, separation(paint, 'image'));
    }
    expect(round(worst)).toBe(1);
  });

  it('reads a real gradient: its two extremes are not the same colour', () => {
    for (const { theme } of THEMES) {
      const paint = resolveChatScreenPaint(theme);
      const ex = chatBackgroundExtremes(paint, 'gradient');
      expect(ex.lightest).not.toBe(ex.darkest);
      expect(contrastRatio(ex.lightest, ex.darkest)).toBeGreaterThan(1);
    }
  });

  it('reads a real pattern: its ink is a neutral step, never the accent', () => {
    for (const { theme } of THEMES) {
      const paint = resolveChatScreenPaint(theme);
      const { accent } = resolveButtonRamps(theme);
      // A wallpaper tinted with the brand colour competes with the outgoing
      // bubble, which IS the brand colour.
      expect(Object.values(accent)).not.toContain(paint.patternTint);
      const inked = mixColor(paint.page, paint.patternTint, 0.5);
      const ex = chatBackgroundExtremes(paint, 'pattern');
      expect([ex.lightest, ex.darkest]).toContain(inked);
    }
  });
});
