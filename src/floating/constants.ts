/**
 * The menu VISUAL SPEC as Tailwind class strings, plus the handful of values
 * that have to stay numbers, plus the one mapping from the target's colour
 * ROLES onto Bloom's tokens.
 *
 * ── WHY CLASSES AND NOT RESOLVED NUMBERS ─────────────────────────────────────
 *
 * The originals — react-native-reusables' menus, and the refined Radix menu this
 * spec is taken from — are built out of utility classes and carry no inline
 * geometry at all (measured: 33 classes / 0 inline styles on RNR's dropdown, 31
 * / 0 on its select). Bloom's port had it exactly the other way round (0 / 1 and
 * 0 / 11), which meant a consumer could not restyle a menu with a utility: an
 * inline `style` wins over a class on web whatever the array order, so every
 * class a caller passed was silently outranked.
 *
 * So the geometry lives here as class strings and is applied through Bloom's own
 * `styled()` primitives. What a caller passes is APPENDED to these, never
 * substituted for them, so a layout class cannot strip the chrome.
 *
 * CONSEQUENCE, stated because it is a real cost: a web consumer that has not
 * wired the Tailwind/NativeWind pipeline and `@source`-scanned
 * `@oxy.so/bloom/lib` now gets an unstyled menu rather than a merely
 * unlaid-out one, because the colours moved out of inline style too. That
 * wiring is already mandatory (Bloom AGENTS.md, "Consumer web CSS pipeline");
 * this makes skipping it visible instead of subtle.
 *
 * ── WHERE EACH NUMBER COMES FROM ─────────────────────────────────────────────
 *
 * `--spacing` is Tailwind's stock 0.25rem, so `py-1.5` is 6px and `min-w-40` is
 * 160px; `p-space-4`, `gap-space-8`, `rounded-radius-16`, `shadow-m` and the
 * colour utilities come from Bloom's own `@theme` block
 * (`design-tokens/theme.css`). Bloom's spacing grid has no 6 rung and its type
 * ramp has no 14, which is why `py-1.5` and `text-sm` are spelled in Tailwind's
 * vocabulary rather than rounded onto a Bloom rung — rounding is exactly the
 * substitution that stops a port looking like its original.
 *
 * ── COLOUR ──────────────────────────────────────────────────────────────────
 *
 * No colour lives here. Every anchored surface — the three menus, the select
 * and the popover — paints BoardUI's `bg-background-primary-default
 * border-border-button-default shadow-dropdown`, resolved from the theme ramps
 * by `menu-palette.ts` and applied INLINE, because those stops exist as no CSS
 * variable a class could name. (The retired shadcn popover chrome —
 * `bg-popover`, `shadow-m`, `w-72 p-4` — is gone; its geometry now lives in
 * `popover/surface.ts`, also inline.)
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
 * alike, because every BoardUI popover class string carries it: `transition
 * duration-150 ease-out` between the resting panel and `opacity-0 scale-95
 * blur-[2px]`, the same shape in and out, with no slide. `ease-out` is Tailwind
 * v4's `cubic-bezier(0, 0, 0.2, 1)`.
 */
export const MENU_MOTION_DURATION = 150;
export const MENU_MOTION_EASING = [0, 0, 0.2, 1] as const;
export const MENU_MOTION_SCALE_FROM = 0.95;
/** `blur-[2px]` — web only; `FloatingPanel` is itself web-only. */
export const MENU_MOTION_BLUR = 2;

/* -------------------------------------------------------------------------- */
/*  The floating panel                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The menu panel: `rounded-2xl border p-2.5
 * max-w-[calc(100vw-32px)]`, with the rows 4px apart (`gap-1` on the panel's
 * flex column). Colour — `bg-background-primary-default`,
 * `border-border-button-default`, `shadow-dropdown` — is NOT a class here: it is
 * resolved from the theme by `menu-palette.ts` and applied inline by
 * `FloatingPanel`, because the ramp stops it uses exist as no CSS variable.
 */
export const MENU_PANEL_CLASS =
  'overflow-hidden rounded-radius-16 border p-[10px] gap-space-4 max-w-[calc(100vw-32px)]';

/**
 * The select's listbox panel: the same surface, `p-2` rather than `p-2.5`
 * ("listbox rows already space themselves 4px apart, so the surface sits a touch
 * tighter than the action-menu Dropdown").
 */
export const LISTBOX_PANEL_CLASS =
  'overflow-hidden rounded-radius-16 border p-space-8 max-w-[calc(100vw-32px)]';

/**
 * `w-[266px]`, as a FLOOR: a menu of short rows is exactly that
 * width, and a longer label grows the panel rather than being cut.
 */
export const MENU_MIN_WIDTH_CLASS = 'min-w-[266px]';

/** The same 266px as a number, for a surface whose floor is an inline `minWidth`. */
export const MENU_WIDTH = 266;

/** A menubar menu takes the same 266px floor — one menu width throughout. */
export const MENUBAR_MENU_MIN_WIDTH_CLASS = 'min-w-[266px]';

/**
 * A sub panel is a FIXED 266px, not a shrink-wrap, so a column of flyouts does
 * not step in and out as their labels change length.
 */
export const MENU_SUB_PANEL_CLASS = 'w-[266px]';

/**
 * The sub panel's scroller: `-mx-2.5 px-2.5 max-h-96 overflow-y-auto
 * overflow-x-hidden`, with the panel's own 4px row rhythm. The negative inset
 * bleeds the scroll container to the panel edge and pads the content back, so
 * the scrollbar track is not inset by the panel's own padding — and it doubles as
 * the flyout's pointer hit box, which is why the ring of panel padding no longer
 * schedules a close.
 */
export const MENU_SUB_SCROLL_CLASS =
  '-mx-[10px] px-[10px] gap-space-4 max-h-96 overflow-y-auto overflow-x-hidden';

/* -------------------------------------------------------------------------- */
/*  The menu row vocabulary                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The menu item recipe: `flex w-full items-center gap-2 rounded-2lg p-2
 * text-left` — 8px on every side and a 10px corner, so a one-line row is
 * 20px of line box + 16px = 36px tall.
 *
 * `min-w-0` is on the row as well as the label, because a flex item's default
 * `min-width: auto` is what stops a long label from ever shrinking.
 */
export const ROW_CLASS =
  'relative flex-row items-center select-none ' +
  'p-space-8 gap-space-8 min-w-0 rounded-[10px]';

/**
 * `cursor-pointer`, applied only while the row is ENABLED.
 *
 * Not part of {@link ROW_CLASS}, and the reason is the one real cost of a
 * class-first vocabulary: two utilities for one property are resolved by
 * Tailwind's own emission order, not by the order they appear in the attribute.
 * `cursor-pointer` is emitted after `cursor-not-allowed`, so a disabled row
 * carrying both drew a pointer — measured. Making the two mutually exclusive
 * removes the contest rather than betting on the order.
 */
export const ROW_ENABLED_CLASS = 'cursor-pointer';

/**
 * `cursor-not-allowed`. The dimming itself is the label's `text-disabled`
 * colour, set inline by the row.
 */
export const ROW_DISABLED_CLASS = 'cursor-not-allowed';

/**
 * A disabled row with NO string label has no label to recolour, so its whole
 * content dims instead.
 */
export const ROW_DISABLED_DIM_CLASS = 'opacity-50';

/** `pl-8` — the checkbox/radio gutter, and what `inset` lines a plain row up with. */
export const ROW_INSET_CLASS = 'pl-space-32';

/** `pl-8 pr-2` on the two rows that carry an out-of-flow indicator. */
export const ROW_GUTTER_CLASS = 'pl-space-32 pr-space-8';

/** `pl-2 pr-8` when that out-of-flow indicator sits on the trailing edge. */
export const ROW_GUTTER_END_CLASS = 'pl-space-8 pr-space-32';

/**
 * The row's own label's LAYOUT. Its type is `text-body-medium`, applied
 * inline by `menu-type.ts` (`TYPE_SCALE` + Inter) — the class-only spelling this
 * used to carry rendered in the system font stack, never Inter.
 *
 * `flex-1 min-w-0` is the target's `<span class="min-w-0 truncate">` — except
 * that the truncation itself is `numberOfLines={1}`, a PROP both platforms
 * implement, rather than the `truncate` class, which compiles to three CSS
 * properties React Native's `Text` does not have.
 *
 * NO `leading-*`, and that is the opposite of a rounding error. `text-sm` ALONE
 * computes 14px/20px, which is the target's line box. Adding `leading-5` — the
 * apparently equivalent spelling of the same 20px — measured 17.5px instead,
 * because `nativewind/theme` emits a SECOND `.leading-N` rule,
 * `line-height: calc(var(--spacing) / 1rem * N)`, that lands after Tailwind's own
 * and turns every `leading-*` into a UNITLESS MULTIPLIER: `leading-5` is 1.25,
 * and so is `leading-[20px]`. Every Oxy consumer imports `nativewind/theme`, so
 * this holds fleet-wide — spell a menu line height by leaving `leading-*` off.
 */
export const ROW_TEXT_CLASS = 'flex-1 min-w-0';

/**
 * The leading slot dims nothing here — row icons are `size-4
 * text-text-secondary` glyphs, and the colour belongs to the icon the caller
 * passes (`MenuPalette.textSecondary` is the matching fill).
 */
export const ROW_LEADING_CLASS = 'shrink-0';

/**
 * `absolute left-2 inset-y-0 size-3.5 items-center justify-center`, stretched
 * top-to-bottom so it centres against whatever the row's height turns out to be.
 *
 * OUT OF FLOW on purpose: a checkbox row's text starts at a fixed 32px whether
 * or not a check is drawn, so a menu's rows line up with each other and with an
 * `inset` plain row.
 */
export const ROW_INDICATOR_CLASS =
  'absolute left-space-8 inset-y-0 w-3.5 items-center justify-center';

/** The same box on a select option, where the tick sits on the RIGHT. */
export const ROW_INDICATOR_END_CLASS =
  'absolute right-space-8 inset-y-0 w-3.5 items-center justify-center';

/** `bg-foreground h-2 w-2 rounded-full` — a filled dot with no ring. */
export const ROW_RADIO_DOT_CLASS = 'w-space-8 h-space-8 rounded-full bg-foreground';

/**
 * The dropdown group label: `pl-2 text-body-medium text-text-secondary`,
 * `pt-1` above it and 6px (`gap-1.5`) to the first row — the panel's 4px gap
 * plus `pb-0.5`. The colour is inline (`MenuPalette.textSecondary`).
 */
export const ROW_LABEL_CLASS = 'px-space-8 pt-space-4 pb-0.5';

/** `pl-8` on a label asking to line up with an indicator row. */
export const ROW_LABEL_INSET_CLASS = 'pl-space-32';

/**
 * The dropdown divider: `-mx-2.5 my-1.5 h-px` — one whole pixel bleeding
 * through the panel's `p-2.5`, 10px from the rows on either side once the
 * panel's 4px gap is added. Colour inline (`MenuPalette.border`).
 */
export const ROW_SEPARATOR_CLASS = '-mx-[10px] my-1.5 h-px';

/** The same rule inside the select's `p-2` listbox. */
export const SELECT_SEPARATOR_CLASS = '-mx-space-8 my-1.5 h-px';

/** `ms-auto text-xs tracking-widest`, in `MenuPalette.textSecondary`. */
export const ROW_SHORTCUT_CLASS = 'shrink-0 ms-auto';

/**
 * `size-4 shrink-0 ms-auto` — the sub-trigger's chevron slot. Its colour is the
 * SVG's `fill` prop rather than a `text-*` class: `react-native-svg` paints from
 * `fill`, not from an inherited CSS colour, so a class here would resolve and
 * change nothing.
 */
export const ROW_CHEVRON_CLASS = 'shrink-0 ms-auto';

/* -------------------------------------------------------------------------- */
/*  The menu bar itself                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The bar: `flex h-10 items-center gap-1 p-1 border`, `rounded-2lg`
 * (10px, concentric with the 6px triggers inside its 4px padding). Its colours —
 * the select trigger's white field, `border-button-default` and `shadow-xs` —
 * are inline from `MenuPalette.trigger`, as every other menu surface's.
 */
export const MENUBAR_CLASS =
  'flex-row items-center self-start h-10 gap-space-4 p-space-4 border rounded-[10px]';

/** The trigger: `flex items-center rounded-md px-2 py-1.5`. */
export const MENUBAR_TRIGGER_CLASS =
  'items-center justify-center px-space-8 py-1.5 rounded-[6px]';

/**
 * Retired: the open trigger's wash is `MenuPalette.rowHighlight`, inline. Kept
 * (empty) so the export does not disappear from under a consumer.
 */
export const MENUBAR_TRIGGER_OPEN_CLASS = '';

export const MENUBAR_TRIGGER_TEXT_CLASS = '';

/* -------------------------------------------------------------------------- */
/*  The select                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The select trigger: `flex items-center justify-between border
 * shadow-xs`, `md` → `gap-1.5 px-2.5 py-2 text-body-medium` (38px tall with its
 * border), `sm` → `gap-1 px-[7px] py-1 text-body-2-medium` (28px). The corner is
 * Bloom's full pill (inline `borderRadius.full`), and the colours come from
 * `MenuPalette.trigger`. The trigger IS the field.
 */
export const SELECT_TRIGGER_CLASS = 'flex-row items-center justify-between border';
export const SELECT_TRIGGER_SIZE_CLASS = {
  md: 'gap-1.5 px-[10px] py-space-8',
  sm: 'gap-space-4 px-[7px] py-space-4',
} as const;

/**
 * `text-body-medium` / `text-body-2-medium` — the value and the placeholder.
 * The 18px line of `sm` rides the size utility's own `/[18px]` modifier, never a
 * `leading-*` class (see {@link ROW_TEXT_CLASS} for why that one is a trap).
 */
export const SELECT_VALUE_CLASS = {
  md: 'shrink min-w-0',
  sm: 'shrink min-w-0',
} as const;

/** The chevron: `size-4` (`md`) / `size-3.5` (`sm`). */
export const SELECT_CHEVRON_SIZE = { md: 16, sm: 14 } as const;

/**
 * A select option — the same menu item recipe (`p-2 gap-2 rounded-2lg`), with a
 * 32px gutter on the RIGHT because that is the side `SelectItemIndicator`'s
 * tick sits on. `sm` rows are `px-2 py-1.5 text-body-2-medium`.
 */
export const SELECT_ITEM_CLASS =
  'relative flex-row items-center w-full min-w-0 select-none ' +
  'gap-space-8 pr-space-32 rounded-[10px]';
export const SELECT_ITEM_SIZE_CLASS = {
  md: 'pl-space-8 py-space-8',
  sm: 'pl-space-8 py-1.5',
} as const;

/** The option's label; colour inline (`text-primary` / `text-disabled`). */
export const SELECT_ITEM_TEXT_CLASS = {
  md: 'flex-1 min-w-0',
  sm: 'flex-1 min-w-0',
} as const;
