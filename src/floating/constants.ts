/**
 * The menu VISUAL SPEC as React Native styles of plain numbers, plus the
 * values JS consumes, plus the one mapping from the target's colour ROLES onto
 * Bloom's tokens.
 *
 * Every number is what the menus have always drawn: Bloom's spacing grid where
 * it has the rung, and the target's own 6px, 10px and 14px where it does not
 * (rounding onto a Bloom rung is exactly the substitution that stops a port
 * looking like its original). Logical keys (`paddingInline`, `insetBlock`,
 * `marginInlineStart`) stay logical, so a right-to-left menu mirrors.
 *
 * ── COLOUR ──────────────────────────────────────────────────────────────────
 *
 * No colour lives here. Every anchored surface — the three menus, the select
 * and the popover — paints `background-primary-default`, `border-button-default`
 * and `shadow-dropdown`, resolved from the theme ramps by `menu-palette.ts` and
 * applied inline. (The popover's geometry lives in `popover/surface.ts`.)
 */
/* -------------------------------------------------------------------------- */
/*  Values that stay NUMBERS, because JS consumes them                        */
/* -------------------------------------------------------------------------- */

/** Minimum distance an anchored surface keeps from every viewport edge. */
export const VIEWPORT_GUTTER = 8;

/**
 * Default gap between an anchor and its surface. Radix/shadcn's `sideOffset={4}`,
 * so a ported call site lands in the same place.
 */
export const DEFAULT_SIDE_OFFSET = 4;

/** Default shift along the alignment axis. Radix's default is 0. */
export const DEFAULT_ALIGN_OFFSET = 0;

/**
 * What each family's ROOT trigger opens, as `aria-haspopup`.
 *
 * Per family and not one shared value, because the five families open three
 * different kinds of surface — a single constant on `TriggerHandleProps` would
 * be right for three of them and a lie for the other two. A screen reader with
 * no `aria-haspopup` gets no warning that the control opens anything at all;
 * with the wrong one it is told to expect the wrong thing.
 *
 * Each pair is imported by BOTH of a family's platform forks, so the two cannot
 * drift apart — the failure that would otherwise be invisible, since only one
 * fork is ever rendered at a time.
 *
 * React Native types no `aria-haspopup` (it is a PROPERTY, with no state to fold
 * into `accessibilityState`) and ignores it; react-native-web forwards it.
 * `styles/styled-primitives.ts`'s `WebAriaProps` is what makes it spellable
 * without a cast.
 */
export const MENU_TRIGGER_POPUP = 'menu';
export const POPOVER_TRIGGER_POPUP = 'dialog';
export const SELECT_TRIGGER_POPUP = 'listbox';

/**
 * The visible gap between a parent panel's EDGE and the sub-panel flying out of
 * it.
 *
 * Deliberately small: the two surfaces should read as one menu with a seam
 * between its columns, not as two detached cards. It is a separate constant from
 * {@link DEFAULT_SIDE_OFFSET} because it measures a different thing — that one
 * is the gap from a TRIGGER, this one the gap from a SURFACE, and
 * `menu-sub-flyout`'s `useFlyoutAnchor` is what makes the horizontal axis
 * measure the surface. Before it did, a 4px offset from the trigger ROW put the
 * sub-panel 1px INSIDE the parent's border, because the row sits inside the
 * panel's own padding and border.
 */
export const MENU_SUB_SIDE_OFFSET = 2;

/** `alignOffset={-4} sideOffset={8}` — a menubar menu's own defaults. */
export const MENUBAR_ALIGN_OFFSET = -4;
export const MENUBAR_SIDE_OFFSET = 8;

/**
 * `size-4` — every glyph in the vocabulary: the row check, the radio's box, the
 * sub-trigger chevron and the select's own chevron. A number because it travels
 * to `react-native-svg` as `width`/`height` PROPS, which no class can set.
 */
export const ROW_ICON_SIZE = 16;

/**
 * `max-h-[240px]` — how tall a web select list grows before it scrolls. A number
 * because it is `SelectContent`'s public `maxHeight` prop, which a caller sets
 * to its own value.
 */
export const SELECT_MAX_HEIGHT = 240;

/**
 * The motion EVERY anchored surface runs — menus, the listbox and the popover
 * alike, because every popover class string carries it: `transition
 * duration-150 ease-out` between the resting panel and `opacity-0 scale-95
 * blur-[2px]`, the same shape in and out, with no slide. `ease-out` is Tailwind
 * v4's `cubic-bezier(0, 0, 0.2, 1)`.
 */
export const MENU_MOTION_DURATION = 150;
export const MENU_MOTION_EASING = [0, 0, 0.2, 1] as const;
export const MENU_MOTION_SCALE_FROM = 0.95;
/** `blur-[2px]` — web only; `FloatingPanel` is itself web-only. */
export const MENU_MOTION_BLUR = 2;

/**
 * A menu bar's one surface changing from one menu into the next (`menubar/viewport.ts`): its
 * place, its size and the two menus' crossfade, on the menu motion's own duration and curve. A
 * timing, never a spring: the surface passes between the two menus' rectangles without
 * overshooting either, and a retarget mid-way starts from where it is.
 */
export const MENU_MORPH_MOTION = {
  duration: MENU_MOTION_DURATION,
  easing: MENU_MOTION_EASING,
} as const;

/* -------------------------------------------------------------------------- */
/*  The floating panel                                                        */
/* -------------------------------------------------------------------------- */

/**
 * A menu's 266px FLOOR: a menu of short rows is exactly that wide, and a longer
 * label grows the panel rather than being cut. A menubar menu and a sub panel
 * take the same floor — one menu width throughout; `minWidth` / `maxWidth`
 * narrow the range per panel.
 */
export const MENU_WIDTH = 266;

/* -------------------------------------------------------------------------- */
/*  The menu row vocabulary                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The menu item recipe: a row, centred, a 10px corner; the density adds its
 * inset, height and gap (`use-menu-density.ts`). `minWidth: 0` is on the row as
 * well as the label, because a flex item's default `min-width: auto` is what
 * stops a long label from ever shrinking.
 */
export const ROW_STYLE = {
  position: 'relative',
  flexDirection: 'row',
  alignItems: 'center',
  userSelect: 'none',
  minWidth: 0,
  borderRadius: 10,
} as const;

/** A disabled row with NO string label has no label to recolour, so its whole content dims. */
export const ROW_DISABLED_DIM_STYLE = { opacity: 0.5 } as const;

/** The 32px checkbox/radio gutter, and what `inset` lines a plain row up with. */
export const ROW_INSET_STYLE = { paddingLeft: 32 } as const;

/** The two rows that carry an out-of-flow indicator, at the leading edge. */
export const ROW_GUTTER_STYLE = { paddingLeft: 32, paddingRight: 8 } as const;

/** The same, when the indicator sits on the trailing edge. */
export const ROW_GUTTER_END_STYLE = { paddingLeft: 8, paddingRight: 32 } as const;

/**
 * The row's own label: it takes the row's remaining width and may shrink to
 * nothing, truncating through `numberOfLines={1}`. Its type is applied by
 * `menu-type.ts` (`TYPE_SCALE` + Inter).
 */
export const ROW_TEXT_STYLE = { minWidth: 0, flexGrow: 1, flexShrink: 1, flexBasis: '0%' } as const;

/** The leading slot never shrinks; its glyph's colour is the caller's. */
export const ROW_LEADING_STYLE = { flexShrink: 0 } as const;

/**
 * The 14px indicator box 8px from the row's leading edge, stretched top to
 * bottom so it centres against whatever the row's height turns out to be.
 *
 * OUT OF FLOW on purpose: a checkbox row's text starts at a fixed 32px whether
 * or not a check is drawn, so a menu's rows line up with each other and with an
 * `inset` plain row.
 */
export const ROW_INDICATOR_STYLE = {
  position: 'absolute',
  insetBlock: 0,
  left: 8,
  width: 14,
  alignItems: 'center',
  justifyContent: 'center',
} as const;

/** The same box on a select option, where the tick sits on the RIGHT. */
export const ROW_INDICATOR_END_STYLE = {
  position: 'absolute',
  insetBlock: 0,
  right: 8,
  width: 14,
  alignItems: 'center',
  justifyContent: 'center',
} as const;

/** A label asking to line up with an indicator row. */
export const ROW_LABEL_INSET_STYLE = { paddingLeft: 32 } as const;

/**
 * The shortcut and the sub-trigger's chevron: pushed to the trailing edge,
 * never shrinking. The chevron's colour is the SVG's `fill` prop.
 */
export const ROW_TRAILING_STYLE = { marginInlineStart: 'auto', flexShrink: 0 } as const;

/* -------------------------------------------------------------------------- */
/*  The menu bar itself                                                       */
/* -------------------------------------------------------------------------- */

/** The bar's corner. */
export const MENUBAR_RADIUS = 10;

/**
 * The bar: a 40px row, 4px padding and gap, a 1px border, a 10px corner
 * (concentric with the 6px triggers inside its 4px padding). Its colours — the
 * select trigger's white field, `border-button-default` and `shadow-xs` — are
 * inline from `MenuPalette.trigger`, as every other menu surface's.
 */
export const MENUBAR_STYLE = {
  height: 40,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  alignSelf: 'flex-start',
  borderRadius: MENUBAR_RADIUS,
  borderStyle: 'solid',
  borderWidth: 1,
  padding: 4,
} as const;

/** The trigger: centred, 8px across and 6px down, a 6px corner. */
export const MENUBAR_TRIGGER_STYLE = {
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 6,
  paddingInline: 8,
  paddingBlock: 6,
} as const;

/* -------------------------------------------------------------------------- */
/*  The select                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The select trigger: a row, its value and chevron apart, a 1px border, and per
 * size its gap, inset and minimum height (`md` 36px, `sm` 32px). The corner is
 * Bloom's full pill (inline `borderRadius.full`), and the colours come from
 * `MenuPalette.trigger`. The trigger IS the field. Padding is spelled in
 * longhands — react-native-web ranks the `padding-inline` a
 * `paddingHorizontal` becomes above `padding-left`, and a caller's
 * `fieldStyle` overrides one side.
 */
export const SELECT_TRIGGER_FIELD_STYLE = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderWidth: 1,
} as const;
export const SELECT_TRIGGER_SIZE_STYLE = {
  xs: { gap: 4, paddingLeft: 8, paddingRight: 8, paddingTop: 5, paddingBottom: 5, minHeight: 28 },
  sm: { gap: 6, paddingLeft: 10, paddingRight: 10, paddingTop: 6, paddingBottom: 6, minHeight: 32 },
  md: { gap: 8, paddingLeft: 12, paddingRight: 12, paddingTop: 7, paddingBottom: 7, minHeight: 36 },
  lg: {
    gap: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 44,
  },
} as const;

/** The chevron: `size-4` (`md`) / `size-3.5` (`sm`). */
export const SELECT_CHEVRON_SIZE = { xs: 14, sm: 16, md: 18, lg: 20 } as const;

/**
 * A select option — the same menu item recipe as a menu row, full width, with a
 * 32px gutter on the RIGHT because that is the side `SelectItemIndicator`'s
 * tick sits on. The density adds its inset, height and gap.
 */
export const SELECT_ITEM_STYLE = {
  position: 'relative',
  flexDirection: 'row',
  alignItems: 'center',
  width: '100%',
  minWidth: 0,
  userSelect: 'none',
  borderRadius: 10,
} as const;
