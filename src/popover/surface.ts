/**
 * The popover PANEL — Bloom's one floating surface, resolved to inline style.
 *
 * Every floating panel (`dropdown/menu-styles.ts`'s `MENU_POPOVER_SURFACE`, the
 * dashboard team/user menus, the calendar inbox menu, the ai-chat menus) spells
 * the same class string:
 *
 *   w-[266px] max-w-[calc(100vw-32px)] overflow-y-auto
 *   rounded-2xl border border-border-button-default
 *   bg-background-primary-default p-2.5 shadow-dropdown
 *   transition duration-150 ease-out, entering/exiting opacity-0 scale-95 blur-[2px]
 *   origin at the placement side, offset 8 (4 on the select / date pickers)
 *
 * The motion is `FloatingPanel`'s; everything else is resolved here.
 *
 * ── WHY INLINE, AND HOW A CALLER'S `className` STILL WINS ────────────────────
 *
 * The colours are ramp stops (`menu-palette.ts`) that exist as no CSS variable,
 * so they cannot be classes. The geometry is inline too, because a default CLASS
 * competes with the caller's class by Tailwind's emission order, not by the order
 * in the attribute — measured on this very family: `DialogHeader`'s
 * `className="w-auto p-space-4"` rendered 16px of padding, because the old
 * `p-space-16` default was emitted later and won.
 *
 * But an inline style beats ANY class on web, so a naive inline default would
 * silently outrank every `className` a caller passes. {@link classChromeOverrides}
 * closes that: it reads which chrome PROPERTIES the caller's utilities name
 * (`w-*`, `p-*`, `rounded-*`, `bg-*`, …) and the matching inline default is left
 * out, so the caller's class is the only rule for that property. A caller's
 * `style` still comes last and overrides everything.
 */
import type { MenuPalette } from '../floating/menu-palette';
import type { WebCssStyle } from '../styles/web-view-style';

/** `w-[266px]` — `MENU_POPOVER_WIDTH`. */
export const POPOVER_WIDTH = 266;
/** `rounded-2xl`. */
export const POPOVER_RADIUS = 16;
/** `p-2.5` — also what `PopoverSeparator` bleeds back through. */
export const POPOVER_PADDING = 10;
/** `max-w-[calc(100vw-32px)]`, as the 32px it subtracts. */
export const POPOVER_VIEWPORT_INSET = 32;
/** Popovers sit `offset={8}` from their trigger. */
export const POPOVER_SIDE_OFFSET = 8;

export type PopoverChromeKey =
  | 'width'
  | 'maxWidth'
  | 'padding'
  | 'radius'
  | 'borderWidth'
  | 'borderColor'
  | 'background'
  | 'shadow'
  | 'overflow';

const BORDER_WIDTH = /^border(-[xytrblse])?(-\d+(\.\d+)?|-\[[^\]]+px\])?$/;

/**
 * Which chrome properties a caller's utility classes set. Variants (`dark:`,
 * `md:`, `hover:`), the important `!` and a negative `-` are stripped first, so
 * `md:!p-0` counts as padding.
 */
export function classChromeOverrides(className?: string): ReadonlySet<PopoverChromeKey> {
  const keys = new Set<PopoverChromeKey>();
  if (!className) return keys;
  for (const raw of className.split(/\s+/)) {
    if (!raw) continue;
    const token = raw.slice(raw.lastIndexOf(':') + 1).replace(/^!/, '').replace(/^-/, '');
    if (/^(w|size)-/.test(token)) keys.add('width');
    else if (/^max-w-/.test(token)) keys.add('maxWidth');
    else if (/^p[xytrblse]?-/.test(token)) keys.add('padding');
    else if (/^rounded(-|$)/.test(token)) keys.add('radius');
    else if (BORDER_WIDTH.test(token)) keys.add('borderWidth');
    else if (/^border-/.test(token)) keys.add('borderColor');
    else if (/^bg-/.test(token)) keys.add('background');
    else if (/^shadow(-|$)/.test(token)) keys.add('shadow');
    else if (/^overflow-/.test(token)) keys.add('overflow');
  }
  return keys;
}

/**
 * The panel's inline chrome, minus every property the caller's `className`
 * names. `maxWidth` is only the default: a numeric `maxWidth` PROP is applied by
 * `FloatingPanel` and must not be overwritten, so the caller passes
 * `viewportWidth` only when no prop was given.
 */
export function resolvePopoverSurfaceStyle(
  palette: MenuPalette,
  overridden: ReadonlySet<PopoverChromeKey>,
  viewportWidth?: number,
): WebCssStyle {
  const style: WebCssStyle = {};
  if (!overridden.has('width')) style.width = POPOVER_WIDTH;
  if (!overridden.has('maxWidth') && viewportWidth !== undefined) {
    style.maxWidth = Math.max(0, viewportWidth - POPOVER_VIEWPORT_INSET);
  }
  if (!overridden.has('padding')) {
    // Longhands: a caller's `style` override of one side must not lose to a
    // shorthand react-native-web ranks above it (AGENTS.md, "Style").
    style.paddingTop = POPOVER_PADDING;
    style.paddingBottom = POPOVER_PADDING;
    style.paddingLeft = POPOVER_PADDING;
    style.paddingRight = POPOVER_PADDING;
  }
  if (!overridden.has('radius')) style.borderRadius = POPOVER_RADIUS;
  if (!overridden.has('borderWidth')) style.borderWidth = 1;
  if (!overridden.has('borderColor')) style.borderColor = palette.border;
  if (!overridden.has('background')) style.backgroundColor = palette.surface;
  if (!overridden.has('shadow')) style.boxShadow = palette.shadow;
  // The panel's `overflow-y-auto` clips a full-bleed child to the 16px corner and
  // scrolls once something bounds the height. React Native types no
  // `overflowY`, and the panel has no default height bound for `auto` to act
  // on, so the default is the clip; a caller that sets `maxHeight` wraps its
  // body in a `ScrollView` (the calendar inbox menu does).
  if (!overridden.has('overflow')) style.overflow = 'hidden';
  return style;
}
