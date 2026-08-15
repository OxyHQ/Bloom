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
 * `@oxyhq/bloom/lib` now gets an unstyled menu rather than a merely
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
 * ── COLOUR ROLES ─────────────────────────────────────────────────────────────
 *
 * The target's tokens are its own app's (`bg-surface-elevated`, `border-border-l1`,
 * `bg-button-ghost-hover`, `text-fg-secondary`) and are not portable. They map
 * onto Bloom's like this. Nothing below is a literal colour, and no token is
 * ever alpha-suffixed (Bloom tokens resolve to `rgb(...)`, so appending hex
 * alpha parses back OPAQUE).
 *
 * | target                   | Bloom class            | why |
 * | ------------------------ | ---------------------- | --- |
 * | `bg-surface-elevated`    | `bg-popover`           | `--popover` is `surfaceContainer`, which sits one step off the page in BOTH schemes (light 249,233,247 vs background 255,239,253; dark 37,29,38 vs 19,12,20). One token, so the panel needs no `dark:` fork — and a `dark:` fork would not be portable anyway, since the fleet disagrees about what `dark:` matches (the website and this harness use the `.dark` class, Mention's build uses the OS scheme) |
 * | `text-primary` (its body colour) | `text-foreground` | same role, same contrast target. NOT Bloom's `--primary`, which is a brand accent |
 * | `border-border-l1`       | `border-border`        | the hairline between surfaces. `--border` and `--input` are the same expression (`outlineVariant`) in every preset |
 * | `bg-button-ghost-hover`  | `bg-accent`            | the row highlight wash — already what every other Bloom row paints |
 * | `text-fg-secondary`      | `text-muted-foreground`| the single de-emphasis step. Bloom has a third, `textTertiary`, that the target has no name for; using it for a shortcut would be a step further out than the original |
 * | destructive row          | `text-error`           | Bloom's themed negative, legible in both modes |
 * | `shadow-md shadow-black/5` | `shadow-m`           | Bloom's overlay elevation role |
 * | `shadow-sm shadow-black/5` | `shadow-s`           | Bloom's control-raise role |
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
 * `max-h-52` — how tall a web select list grows before it scrolls. A number
 * because it is `SelectContent`'s public `maxHeight` prop, which a caller sets
 * to its own value.
 */
export const SELECT_MAX_HEIGHT = 208;

/**
 * How long the enter and the exit run, and the curve they run on.
 *
 * `200ms` and `--ease-out-quint` = `cubic-bezier(0.22, 1, 0.36, 1)` are the
 * target's own. Both directions take the same duration, as the target does; the
 * exit's value is also what `FloatingPanel` waits before it unmounts, so the two
 * cannot drift apart.
 */
export const PANEL_MOTION_DURATION = 200;
export const PANEL_MOTION_EASING = [0.22, 1, 0.36, 1] as const;

/** `zoom-in-95` / `zoom-out-95`. */
export const PANEL_MOTION_SCALE_FROM = 0.95;

/** `slide-in-from-<side>-2` — 8px along the axis the surface sits on. */
export const PANEL_MOTION_SLIDE = 8;

/* -------------------------------------------------------------------------- */
/*  The floating panel                                                        */
/* -------------------------------------------------------------------------- */

/**
 * `rounded-2xl border bg-surface-elevated p-1 shadow-md text-primary`.
 *
 * `p-space-4` is FOUR-sided: the rows sit 4px in from the border on every edge,
 * which is also what gives the separator's `-mx-space-4` something to bleed back
 * through. `overflow-hidden` keeps a row's 12px highlight inside the panel's own
 * 16px corner.
 */
export const PANEL_CLASS =
  'overflow-hidden rounded-radius-16 border border-border bg-popover p-space-4 shadow-m';

/** `min-w-40` — 160px, a dropdown and context menu panel's own floor. */
export const MENU_MIN_WIDTH_CLASS = 'min-w-40';

/** `min-w-[12rem]` — a menubar menu is wider than a dropdown. */
export const MENUBAR_MENU_MIN_WIDTH_CLASS = 'min-w-48';

/**
 * `min-w-[200px] w-64` — a sub panel is a FIXED 256px, not a shrink-wrap, so a
 * column of flyouts does not step in and out as their labels change length.
 */
export const MENU_SUB_PANEL_CLASS = 'w-64';

/**
 * The sub panel's scroller: `-mx-1 px-1 max-h-96 overflow-y-auto
 * overflow-x-hidden`. The negative inset bleeds the scroll container to the
 * panel edge and pads the content back, so the scrollbar track is not inset by
 * the panel's own `p-1` — and it doubles as the flyout's pointer hit box, which
 * is why the ring of panel padding no longer schedules a close.
 */
export const MENU_SUB_SCROLL_CLASS =
  '-mx-space-4 px-space-4 max-h-96 overflow-y-auto overflow-x-hidden';

/** `w-72 p-4` — a popover holds prose, so it is a fixed card with a real inset. */
export const POPOVER_CLASS = 'w-72 p-space-16';

/* -------------------------------------------------------------------------- */
/*  The menu row vocabulary                                                   */
/* -------------------------------------------------------------------------- */

/**
 * `relative flex select-none items-center cursor-pointer px-2 py-1.5 rounded-xl
 * text-sm gap-2 outline-hidden min-h-8`.
 *
 * The 32px MINIMUM is the target's, and it is what makes a menu of one-line rows
 * read as a list rather than as text: the row's own content is 20px of line box
 * plus 12px of inset, so it only bites when a row is shorter than that.
 *
 * `min-w-0` is on the row as well as the label, because a flex item's default
 * `min-width: auto` is what stops a long label from ever shrinking.
 */
export const ROW_CLASS =
  'relative flex-row items-center select-none ' +
  'px-space-8 py-1.5 gap-space-8 min-h-space-32 min-w-0 rounded-radius-12';

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

/** `data-[highlighted]:bg-button-ghost-hover` — pointer hover and press. */
export const ROW_HIGHLIGHT_CLASS = 'bg-accent';

/** `aria-disabled:opacity-50 aria-disabled:cursor-not-allowed`. */
export const ROW_DISABLED_CLASS = 'opacity-50 cursor-not-allowed';

/** `pl-8` — the checkbox/radio gutter, and what `inset` lines a plain row up with. */
export const ROW_INSET_CLASS = 'pl-space-32';

/** `pl-8 pr-2` on the two rows that carry an out-of-flow indicator. */
export const ROW_GUTTER_CLASS = 'pl-space-32 pr-space-8';

/**
 * The row's own label: `text-sm`, no weight of its own.
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
export const ROW_TEXT_CLASS = 'flex-1 min-w-0 text-sm text-foreground';

/** The same label on a `variant="destructive"` row. */
export const ROW_TEXT_DESTRUCTIVE_CLASS = 'flex-1 min-w-0 text-sm text-error';

/**
 * `16×16, stroke-[2], opacity-70` — the target's base leading-icon treatment is a
 * FULL-COLOUR glyph at 70%, not a secondary-coloured one, so an icon reads as
 * part of its row rather than as a second de-emphasised thing beside the label.
 */
export const ROW_LEADING_CLASS = 'shrink-0 opacity-70';

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

/** `text-foreground px-2 py-1.5 text-sm font-medium` — a heading over its group. */
export const ROW_LABEL_CLASS = 'px-space-8 py-1.5 text-sm font-medium text-foreground';

/** `pl-8` on a label asking to line up with an indicator row. */
export const ROW_LABEL_INSET_CLASS = 'pl-space-32';

/** `bg-border -mx-1 my-1 h-px` — one whole pixel, bleeding through the panel's `p-1`. */
export const ROW_SEPARATOR_CLASS = '-mx-space-4 my-space-4 h-px bg-border';

/** `text-muted-foreground ms-auto text-xs tracking-widest`. */
export const ROW_SHORTCUT_CLASS =
  'shrink-0 ms-auto text-xs tracking-widest text-muted-foreground';

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

/** `bg-background border flex h-10 flex-row items-center gap-1 rounded-md border p-1 shadow-sm`. */
export const MENUBAR_CLASS =
  'flex-row items-center self-start h-10 gap-space-4 p-space-4 ' +
  'border border-border bg-background rounded-radius-8 shadow-s';

/** The trigger: `flex items-center rounded-md px-2 py-1.5 text-sm font-medium`. */
export const MENUBAR_TRIGGER_CLASS =
  'items-center justify-center px-space-8 py-1.5 rounded-radius-8';

/** `bg-accent` while its own menu is open. */
export const MENUBAR_TRIGGER_OPEN_CLASS = 'bg-accent';

export const MENUBAR_TRIGGER_TEXT_CLASS = 'text-sm font-medium text-foreground';

/* -------------------------------------------------------------------------- */
/*  The select                                                                */
/* -------------------------------------------------------------------------- */

/**
 * `border-input bg-background flex h-10 flex-row items-center justify-between
 * gap-2 rounded-md border px-3 py-2 shadow-sm`. The trigger IS the field.
 */
export const SELECT_TRIGGER_CLASS =
  'flex-row items-center justify-between h-10 gap-space-8 px-space-12 py-space-8 ' +
  'border border-input bg-background rounded-radius-8 shadow-s';

/** `text-foreground line-clamp-1 text-sm` — the value the trigger displays. */
export const SELECT_VALUE_CLASS = 'text-sm text-foreground';

/** The same line while the select is showing its placeholder. */
export const SELECT_PLACEHOLDER_CLASS = 'text-sm text-muted-foreground';

/**
 * `relative flex w-full flex-row items-center gap-2 rounded-xl py-1.5 pl-2 pr-8`
 * — a select option, whose 32px gutter is on the RIGHT because that is the side
 * its tick sits on.
 */
export const SELECT_ITEM_CLASS =
  'relative flex-row items-center w-full min-w-0 select-none cursor-pointer ' +
  'py-1.5 pl-space-8 pr-space-32 gap-space-8 min-h-space-32 rounded-radius-12';

/** `text-foreground select-none text-sm`. */
export const SELECT_ITEM_TEXT_CLASS = 'flex-1 min-w-0 text-sm text-foreground';

