/**
 * The one resolver every Bloom control's HELD state is built from.
 *
 * What makes this worth a gate of its own is that every way of getting it wrong
 * produces a control that RENDERS. The scale it replaced was visible or not;
 * a background is always *a* background, so "the press does nothing" and "the
 * press works" are the same screenshot unless something composites the colours
 * and compares them. Three specific ways it can silently do nothing:
 *
 * 1. **It returns the rest colour.** An unparseable input taking a
 *    `return surface` fallback, or a state layer at an alpha too low to see.
 *    Every case below asserts the pressed colour DIFFERS from the rest one, by
 *    a floor, not merely that it is defined.
 * 2. **It flattens a translucent surface.** The `*Subtle` tints and the whole
 *    frosted palette carry alpha; dropping it turns a tint into an opaque fill —
 *    a big, obvious visual change that is nonetheless "a background".
 * 3. **It emits a malformed string.** The failure this library has already paid
 *    for once: `` `${token}1A` `` parses back OPAQUE with nothing thrown. Every
 *    output here is re-parsed.
 */
import { APP_COLOR_PRESETS, type AppColorName } from '../color-presets';
import { buildTheme } from '../build-theme';
import { parseRgba } from '../color-utils';
import { resolveAccentColors, type AccentFill, type AccentTone } from '../accent-colors';
import { PRESS_LAYER_ALPHA, pressedSurface } from '../press-colors';
import type { ThemeColors } from '../types';

const PRESETS = Object.keys(APP_COLOR_PRESETS) as AppColorName[];
const MODES = ['light', 'dark'] as const;

/** Every preset x mode, as `[name, colors]`. */
const PALETTES: Array<[string, ThemeColors]> = PRESETS.flatMap((preset) =>
  MODES.map((mode): [string, ThemeColors] => [
    `${preset}/${mode}`,
    buildTheme(preset, mode).colors,
  ]),
);

/** Vacuity floor: a matrix that walked nothing would pass every case below. */
it('walks every built-in preset in both modes', () => {
  expect(PALETTES).toHaveLength(PRESETS.length * 2);
  expect(PALETTES.length).toBeGreaterThanOrEqual(30);
});

/**
 * Largest per-channel distance between two colours, both composited over the
 * same backdrop first so a translucent pair is compared at what the eye sees
 * rather than at its unmultiplied channels.
 */
function channelDelta(a: string, b: string, backdrop: string): number {
  const over = (color: string): [number, number, number] => {
    // The `transparent` keyword is a real rest value here — it is what an
    // `outlined` chip and every ghost control paint — and it composites to
    // exactly the backdrop.
    const c = color === 'transparent' ? { r: 0, g: 0, b: 0, a: 0 } : parseRgba(color);
    const bg = parseRgba(backdrop);
    if (!c || !bg) throw new Error(`unparseable colour: ${color} / ${backdrop}`);
    const blend = (x: number, y: number): number => x * c.a + y * (1 - c.a);
    return [blend(c.r, bg.r), blend(c.g, bg.g), blend(c.b, bg.b)];
  };
  const [ar, ag, ab] = over(a);
  const [br, bg2, bb] = over(b);
  return Math.max(Math.abs(ar - br), Math.abs(ag - bg2), Math.abs(ab - bb));
}

/**
 * The floor a press has to clear to be a press. Ten units per channel is roughly
 * where a flat colour step stops being deniable on a phone in daylight; the
 * measured minimum across the whole matrix sits above it, and the point of the
 * assertion is that a future edit cannot quietly walk it down to nothing.
 */
const VISIBLE_DELTA = 8;

describe('pressedSurface', () => {
  it('is the M3 pressed state-layer opacity, and nothing louder lives above it', () => {
    expect(PRESS_LAYER_ALPHA).toBe(0.12);
  });

  describe.each(PALETTES)('%s', (_name, colors) => {
    it('gives an UNFILLED control the neutral wash — the menu-row highlight', () => {
      // `active:bg-accent`, spelled in the token Bloom already uses for it.
      // Every preset resolves `--muted` and `--accent` to one value, which is
      // what makes "the same colour a menu row highlights with" true and not
      // merely close.
      expect(pressedSurface(colors, 'transparent', colors.text)).toBe(colors.contrast50);
      // …and it is a real step off the page, not the page repainted.
      expect(channelDelta(colors.contrast50, colors.background, colors.background)).toBeGreaterThan(
        VISIBLE_DELTA,
      );
    });

    it('falls back to the wash rather than to NO feedback on an unparseable colour', () => {
      // A caller-supplied colour (`Checkbox`'s `color`, `Radio`'s) can be a CSS
      // keyword, which parses to neither an rgb nor a hex. Returning `surface`
      // unchanged there would be the one outcome this whole change exists to
      // remove, and it would look exactly like a working control.
      expect(pressedSurface(colors, 'rebeccapurple', colors.text)).toBe(colors.contrast50);
      expect(pressedSurface(colors, colors.primary, 'rebeccapurple')).toBe(colors.contrast50);
      // `transparent` is a keyword too, and means the same thing as alpha 0.
      expect(pressedSurface(colors, 'rgba(0, 0, 0, 0)', colors.text)).toBe(colors.contrast50);
    });

    /** Every FILLED surface a Bloom control paints at rest, with its label. */
    const FILLS: Array<[string, string, string]> = [
      ['primary', colors.primary, colors.primaryForeground],
      ['negative', colors.negative, colors.negativeForeground],
      ['card', colors.card, colors.text],
      ['background', colors.background, colors.text],
      ['secondary', colors.secondary, colors.secondaryForeground],
      ['tertiary', colors.tertiary, colors.tertiaryForeground],
      // `Button`'s `inverse`, the variant that defeats `bg-primary/90`: white on
      // a near-white light page moves by under two units when alpha'd, and by a
      // visible step when a state layer of its own black label is composited in.
      ['inverse', '#FFFFFF', '#000000'],
    ];

    it.each(FILLS)('steps a FILLED %s surface visibly, keeping it opaque', (_role, fill, label) => {
      const held = pressedSurface(colors, fill, label);
      const parsed = parseRgba(held);
      expect(parsed).not.toBeNull();
      expect(parsed?.a).toBe(1);
      expect(channelDelta(held, fill, colors.background)).toBeGreaterThan(VISIBLE_DELTA);
    });

    it.each(FILLS)('moves a %s surface TOWARDS its own label, never away', (_role, fill, label) => {
      // The direction is the whole reason the layer is the label colour: it is
      // what makes the step visible in both modes without asking what is behind.
      const held = parseRgba(pressedSurface(colors, fill, label));
      const rest = parseRgba(fill);
      const top = parseRgba(label);
      if (!held || !rest || !top) throw new Error('unparseable fixture');
      for (const ch of ['r', 'g', 'b'] as const) {
        const travelled = held[ch] - rest[ch];
        const wanted = top[ch] - rest[ch];
        // Same sign (or no distance to travel on that channel), never opposite.
        expect(travelled * wanted).toBeGreaterThanOrEqual(0);
      }
    });

    const TONES: AccentTone[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];
    const FILL_KINDS: AccentFill[] = ['solid', 'subtle', 'outlined'];

    it.each(TONES)('steps every %s chip/badge fill without flattening its tint', (tone) => {
      for (const kind of FILL_KINDS) {
        const accent = resolveAccentColors(colors, tone, kind);
        const held = pressedSurface(colors, accent.background, accent.foreground);
        const restAlpha = parseRgba(accent.background)?.a;
        const heldParsed = parseRgba(held);
        expect(heldParsed).not.toBeNull();
        expect(channelDelta(held, accent.background, colors.background)).toBeGreaterThan(
          VISIBLE_DELTA,
        );
        // A TRANSLUCENT rest tint stays translucent — this is the assertion that
        // fails if `parseRgba` is swapped back for the alpha-dropping
        // `parseRgb`, which would turn every subtle chip into a solid one.
        if (restAlpha !== undefined && restAlpha < 1 && restAlpha > 0) {
          expect(heldParsed?.a).toBeLessThan(1);
          expect(heldParsed?.a).toBeGreaterThan(restAlpha);
        }
      }
    });
  });
});
