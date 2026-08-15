/**
 * The react-native-reusables VISUAL SPEC, resolved to numbers, plus the one
 * mapping from shadcn's colour ROLES onto Bloom's tokens.
 *
 * Bloom ports RNR's API; the geometry below is what makes a ported call site
 * also LOOK like the original. RNR expresses it in Tailwind classes, which are
 * inert here — Bloom applies colour inline and a consumer's web build only has
 * the layout utilities if it wired the Tailwind pipeline. So the classes are
 * resolved once, here, and read as plain style values by the families.
 *
 * ── HOW A NUMBER BELOW WAS DERIVED ────────────────────────────────────────────
 *
 * Every value is `nativewind/preset` (Tailwind v3.4 defaults) as configured by
 * RNR's own apps — `apps/showcase/tailwind.config.js` and `apps/docs`, which
 * agree — at revision 119d0b10. The one non-default input is the radius ramp:
 *
 *     --radius: 0.625rem          → 10px
 *     rounded-lg = var(--radius)              → 10px
 *     rounded-md = calc(var(--radius) - 2px)  →  8px
 *     rounded-sm = calc(var(--radius) - 4px)  →  6px
 *
 * Reading `rounded-md`/`rounded-sm` off STOCK Tailwind instead gives 6px/2px,
 * which is wrong for RNR by a third of a corner on every menu row. Anything
 * else is stock: spacing `1`=4 `1.5`=6 `2`=8 `3`=12 `8`=32, `text-xs`=12/16,
 * `text-sm`=14/20, `text-base`=16/24, `tracking-widest`=0.1em, `sm:`=640px.
 *
 * ── WHY 6px IS WRITTEN OUT RATHER THAN TAKEN FROM `design-tokens/scales.ts` ───
 *
 * Bloom's scale is a 4px grid (2, 4, 8, 12, 16, 20, …) and has no 6 rung, in
 * either its numeric authority or the t-shirt view `styles/tokens.ts` publishes
 * over it — and those two are compared VALUE SET for VALUE SET by
 * `design-tokens.test.ts`, so a rung cannot be added to one alone. There is also
 * no free t-shirt name between `xs` (4) and `sm` (8); re-lettering the ramp is a
 * library-wide breaking change for one imported number. shadcn's 6 comes off a
 * different grid — `calc(0.625rem - 4px)`, and Tailwind's `1.5` rung — so it is
 * spelled out with the class string that produced it rather than rounded to
 * Bloom's 8, which is exactly the substitution that makes a port stop looking
 * like its original. Values that DO land on a Bloom rung read it by reference.
 *
 * ── COLOUR ROLES ─────────────────────────────────────────────────────────────
 *
 * The interpretive half. shadcn names a role, Bloom resolves a token; nothing
 * below is a literal colour, and no token is ever alpha-suffixed (Bloom tokens
 * resolve to `rgb(...)`, so appending hex alpha parses back OPAQUE).
 *
 * | shadcn / RNR             | Bloom                                    | why |
 * | ------------------------ | ---------------------------------------- | --- |
 * | `bg-popover`             | `background`, `backgroundSecondary` dark | RNR's `--popover` IS `--background` in both schemes; Bloom lifts a dark overlay one step so it separates from the page instead of vanishing into it |
 * | `text-popover-foreground`| `text`                                   | same role, same contrast target |
 * | `text-foreground`        | `text`                                   | direct |
 * | `text-muted-foreground`  | `textSecondary`                          | `--muted-foreground` is the single de-emphasis step (45.1% / 63.9% L). Bloom has a THIRD step, `textTertiary`, that shadcn has no name for — using it for a shortcut or a select label is a step further out than the original |
 * | `border-border`          | `borderLight`                            | the hairline between surfaces |
 * | `border-input`           | `border`                                 | a control's own edge, one step stronger than a divider — the distinction `--input` exists to make |
 * | `bg-accent`              | `contrast50`                             | the row hover/active wash. Already what `Item` and `SubtleHover` paint, so a menu row highlights like every other Bloom row |
 * | `text-accent-foreground` | `text`                                   | `--accent-foreground` equals `--foreground` in RNR's palette |
 * | `bg-primary`             | `primary`                                | direct |
 * | `text-primary-foreground`| `primaryForeground`                      | the preset's readable-on-primary pair |
 * | `bg-secondary`           | `backgroundSecondary` + `text`           | `--secondary` is a NEUTRAL surface (96.1% / 14.9% L), not an accent. Bloom's `colors.secondary` is a real M3 accent hue, so it is the wrong token despite the matching name |
 * | `text-destructive`       | `error`                                  | direct |
 * | `bg-destructive`         | `resolveAccentColors(colors,'error',…)`  | the fill/foreground PAIR, which is the only way to get a legible label — see `theme/accent-colors.ts` |
 * | `shadow-lg shadow-black/5`, `shadow-md shadow-black/5` | `bloomShadowStyle('m')` | Bloom's overlay elevation role |
 * | `shadow-sm shadow-black/5`                             | `bloomShadowStyle('s')` | Bloom's control-raise role |
 * | `opacity-50` on a disabled row | `Item`'s own disabled treatment      | 0.5, same number, already in one place |
 */
import { RADIUS, SPACING } from '../design-tokens/scales';

/** Minimum distance an anchored surface keeps from every viewport edge. */
export const VIEWPORT_GUTTER = 8;

/**
 * Default gap between an anchor and its surface, matching shadcn/RNR's
 * `sideOffset={4}` so a ported call site lands in the same place.
 */
export const DEFAULT_SIDE_OFFSET = 4;

/** Default shift along the alignment axis. Radix's default is 0. */
export const DEFAULT_ALIGN_OFFSET = 0;

/* -------------------------------------------------------------------------- */
/*  The floating panel — every menu, popover and select surface               */
/* -------------------------------------------------------------------------- */

/** `rounded-md` on the content panel. */
export const PANEL_RADIUS = RADIUS['radius-8'];

/** `border` — one CSS pixel, not a hairline. */
export const PANEL_BORDER_WIDTH = 1;

/** `p-1` on a menu content panel: 4px on ALL four sides, not just vertical. */
export const PANEL_PADDING = SPACING['space-4'];

/** `p-4` — a popover holds prose, so its inset is four times a menu's. */
export const POPOVER_PADDING = SPACING['space-16'];

/** `w-72` — shadcn's popover is a FIXED width, not a shrink-wrap. */
export const POPOVER_WIDTH = 288;

/** `min-w-[8rem]` on a dropdown, context menu and select content panel. */
export const MENU_MIN_WIDTH = 128;

/** `min-w-[12rem]` — a menubar menu is wider than a dropdown. */
export const MENUBAR_MENU_MIN_WIDTH = 192;

/** `max-h-52` — how tall a web select list grows before it scrolls. */
export const SELECT_MAX_HEIGHT = 208;

/* -------------------------------------------------------------------------- */
/*  The menu row vocabulary                                                   */
/* -------------------------------------------------------------------------- */

/** `rounded-sm` on every row, label and sub-trigger. */
export const ROW_RADIUS = 6;

/** `px-2`. */
export const ROW_PADDING_X = SPACING['space-8'];

/** `py-2` — the row inset below the `sm` breakpoint. */
export const ROW_PADDING_Y = SPACING['space-8'];

/** `sm:py-1.5` — the row inset from 640px up. */
export const ROW_PADDING_Y_SM = 6;

/** `gap-2` between a row's indicator, its label and its trailing slot. */
export const ROW_GAP = SPACING['space-8'];

/** `pl-8` — the checkbox/radio gutter, and what `inset` lines a plain row up with. */
export const ROW_INSET_PADDING_X = SPACING['space-32'];

/**
 * `h-3.5 w-3.5` — the indicator box, positioned `absolute left-2` (or `right-2`
 * in a select) so it takes NO part in the row's flow. That is why the gutter is
 * a padding rather than a leading slot: the row's text starts at a fixed 32px
 * whether or not anything is drawn in it.
 */
export const ROW_INDICATOR_BOX = 14;

/** `left-2` / `right-2` — where that box sits inside the gutter. */
export const ROW_INDICATOR_INSET = SPACING['space-8'];

/** `size-4` — the check glyph, deliberately larger than the box it centres in. */
export const ROW_ICON_SIZE = 16;

/** `h-2 w-2 rounded-full` — the radio dot. */
export const ROW_RADIO_DOT = SPACING['space-8'];

/** `-mx-1 my-1 h-px` — the separator bleeds into the panel's own `p-1`. */
export const ROW_SEPARATOR_INSET_X = -SPACING['space-4'];
export const ROW_SEPARATOR_MARGIN_Y = SPACING['space-4'];
export const ROW_SEPARATOR_THICKNESS = 1;

/* -------------------------------------------------------------------------- */
/*  The menu bar itself                                                       */
/* -------------------------------------------------------------------------- */

/** `h-10` / `sm:h-9`. */
export const MENUBAR_HEIGHT = 40;
export const MENUBAR_HEIGHT_SM = 36;

/** `gap-1 p-1 rounded-md border`. */
export const MENUBAR_GAP = SPACING['space-4'];
export const MENUBAR_PADDING = SPACING['space-4'];
export const MENUBAR_RADIUS = RADIUS['radius-8'];

/** The trigger: `rounded-md px-2 py-1.5 sm:py-1`. */
export const MENUBAR_TRIGGER_RADIUS = RADIUS['radius-8'];
export const MENUBAR_TRIGGER_PADDING_X = SPACING['space-8'];
export const MENUBAR_TRIGGER_PADDING_Y = 6;
export const MENUBAR_TRIGGER_PADDING_Y_SM = SPACING['space-4'];

/** `alignOffset={-4} sideOffset={8}` — a menubar menu's own defaults. */
export const MENUBAR_ALIGN_OFFSET = -SPACING['space-4'];
export const MENUBAR_SIDE_OFFSET = SPACING['space-8'];

/* -------------------------------------------------------------------------- */
/*  The select trigger                                                        */
/* -------------------------------------------------------------------------- */

/** `h-10` / `sm:h-9`, and `h-8` for `size="sm"`. */
export const SELECT_TRIGGER_HEIGHT = 40;
export const SELECT_TRIGGER_HEIGHT_SM = 36;
export const SELECT_TRIGGER_HEIGHT_COMPACT = 32;

/** `px-3 py-2 gap-2 rounded-md border`. */
export const SELECT_TRIGGER_PADDING_X = SPACING['space-12'];
export const SELECT_TRIGGER_PADDING_Y = SPACING['space-8'];
export const SELECT_TRIGGER_GAP = SPACING['space-8'];
export const SELECT_TRIGGER_RADIUS = RADIUS['radius-8'];

/** `py-1` on the two web-only scroll buttons. */
export const SELECT_SCROLL_BUTTON_PADDING_Y = SPACING['space-4'];

/* -------------------------------------------------------------------------- */
/*  Type                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Tailwind's `text-sm` and `text-xs` — the two sizes the whole menu / select
 * vocabulary is set in. Bloom's own `fontSize` ramp is 13 / 15 / 17 and has
 * neither, for the same reason the spacing grid has no 6: it is a different
 * ramp, and rounding 14 to 13 or 15 is what makes a ported row read as a Bloom
 * row. The base `Text` size is NOT touched — see `typography/`.
 */
export const TEXT_SM = 14;
export const TEXT_SM_LINE_HEIGHT = 20;
export const TEXT_XS = 12;
export const TEXT_XS_LINE_HEIGHT = 16;

/** `font-medium` on a menu label and a menubar trigger. */
export const FONT_MEDIUM = '500' as const;

/** `tracking-widest` = 0.1em, at `text-xs`. */
export const SHORTCUT_LETTER_SPACING = TEXT_XS * 0.1;
