/**
 * The level picker's SPEC: the geometry both forks lay out from, the colour
 * roles as Tailwind classes, and the two functions that map a stop to a
 * position and a pointer back to a stop.
 *
 * ── WHY GEOMETRY IS NUMBERS HERE AND COLOUR IS CLASSES ───────────────────────
 *
 * `floating/constants.ts` states the menu vocabulary as class strings, so a
 * consumer can restyle a row with a utility. That reasoning applies to the
 * parts a consumer addresses — and none of these are: the rail, its stops and
 * its knob are one control's internals, and the caller's `className` lands on
 * the picker's ROOT.
 *
 * What it buys instead is the property that matters most for a two-fork
 * component: the web fork positions a stop with `calc()` and the native fork
 * with a measured pixel offset, and BOTH read the numbers below and call
 * {@link levelStopPosition}. Two forks that agreed only by having the same
 * literals typed into them is exactly the drift `MENU_SUB_SIDE_OFFSET` and
 * `SUB_TRIGGER_CLASS` exist to prevent one level up.
 *
 * Colour stays in classes, because that is what the surrounding menu rows are
 * painted with and because a token is never derived from — `bg-muted-foreground/25`
 * is the opacity UTILITY (`color-mix`, resolved by the build), never an alpha
 * appended to a resolved `rgb(...)`, which parses back opaque.
 */

/* -------------------------------------------------------------------------- */
/*  Geometry — numbers, because both forks compute with them                  */
/* -------------------------------------------------------------------------- */

/** The rail: a 24px pill, tall enough to read as a track rather than a line. */
export const LEVEL_TRACK_HEIGHT = 24;

/**
 * The knob, LARGER than the rail on purpose (30 against 24), so it reads as a
 * control riding the track rather than a dot inside it. It therefore overhangs
 * the rail by 3px top and bottom, and by 2px past each end once
 * {@link LEVEL_STOP_INSET} is applied — which is why nothing between the rail
 * and the picker's root may clip.
 */
export const LEVEL_THUMB_SIZE = 30;

/** A stop: a 4px dot, drawn under the knob. */
export const LEVEL_STOP_SIZE = 4;

/**
 * How far the FIRST and LAST stop sit in from the rail's ends.
 *
 * Not a cosmetic margin: it is what stops the knob from hanging half off the
 * rail at either extreme, so it is also the value {@link levelFromOffset} has
 * to subtract before it can read a fraction — a hit map that ignores it snaps
 * to the wrong stop for the first and last {@link LEVEL_STOP_INSET} pixels,
 * which is precisely where a user aiming for "least" or "most" clicks.
 */
export const LEVEL_STOP_INSET = 13;

/** The row the rail sits in — one Bloom row taller than the rail itself. */
export const LEVEL_SLIDER_ROW_HEIGHT = 40;

/**
 * The horizontal inset of everything in the picker that is not a menu row,
 * matching `floating/constants`' `ROW_CLASS` (`px-space-8`) so the rail and the
 * end captions line up with the rows above and below them.
 */
export const LEVEL_ROW_INSET = 8;

/* -------------------------------------------------------------------------- */
/*  Colour roles — classes, as the surrounding menu rows are                  */
/* -------------------------------------------------------------------------- */

/** The unfilled rail. */
export const LEVEL_TRACK_CLASS = 'relative rounded-full bg-muted-foreground/25';

/** The filled part, which ends under the knob rather than at the rail's end. */
export const LEVEL_FILL_CLASS = 'absolute left-0 rounded-full bg-primary';

/** A stop the level has NOT reached: a dot on the bare rail. */
export const LEVEL_STOP_CLASS = 'absolute rounded-full bg-muted-foreground/65';

/** A stop the level HAS reached: the same dot, on the fill, in its on-colour. */
export const LEVEL_STOP_REACHED_CLASS = 'absolute rounded-full bg-primary-foreground/35';

/** The knob. `shadow-s` is Bloom's control-raise role, the same one `Slider` takes. */
export const LEVEL_THUMB_CLASS = 'absolute rounded-full bg-background shadow-s';

/** The two end captions, one de-emphasis step back, as a menu shortcut is. */
export const LEVEL_CAPTION_CLASS = 'text-xs text-muted-foreground';

/** The hairline between the summary row and the details region. */
export const LEVEL_SEPARATOR_CLASS = 'h-px bg-border';

/* -------------------------------------------------------------------------- */
/*  The two mappings, written once for both forks                             */
/* -------------------------------------------------------------------------- */

/**
 * Where a stop sits along the rail, as a PERCENTAGE of the rail plus a pixel
 * OFFSET — the one form both forks can render from.
 *
 * The web fork spells it `calc(P% + Opx)` and never measures; the native fork
 * multiplies the percentage by a laid-out width. Returning the pair rather than
 * a finished value is what lets one formula serve both: a shared function that
 * returned pixels would force the web fork to measure, and one that returned a
 * CSS string would be unusable on native.
 */
export function levelStopPosition(
  index: number,
  count: number,
): { percent: number; offset: number } {
  const fraction = count <= 1 ? 0 : index / (count - 1);
  return {
    percent: fraction * 100,
    offset: LEVEL_STOP_INSET - fraction * 2 * LEVEL_STOP_INSET,
  };
}

/**
 * Which stop a pointer at `offsetX` from the rail's left edge is asking for.
 *
 * The inverse of {@link levelStopPosition}, and it undoes the inset for the
 * reason spelled out there. `trackWidth` is the rail's own width — the caller
 * measures it (`getBoundingClientRect().width` on web, `onLayout` on native),
 * so this stays pure and testable.
 */
export function levelFromOffset(offsetX: number, trackWidth: number, count: number): number {
  if (count <= 1) return 0;
  const usable = trackWidth - 2 * LEVEL_STOP_INSET;
  const fraction = usable <= 0 ? 0 : (offsetX - LEVEL_STOP_INSET) / usable;
  const index = Math.round(fraction * (count - 1));
  return Math.max(0, Math.min(count - 1, index));
}
