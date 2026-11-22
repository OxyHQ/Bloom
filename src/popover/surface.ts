/**
 * The popover PANEL — Bloom's one floating surface, resolved to inline style.
 *
 * Every floating panel in the fleet — the sidebar team and user menus, the
 * calendar inbox menu, the ai-chat menus — spells the same class string:
 *
 *   w-[266px] max-w-[calc(100vw-32px)] overflow-y-auto
 *   rounded-2xl border border-border-button-default
 *   bg-background-primary-default p-2.5 shadow-dropdown
 *   transition duration-150 ease-out, entering/exiting opacity-0 scale-95 blur-[2px]
 *   origin at the placement side, offset 8 (4 on the select / date pickers)
 *
 * The motion is `FloatingPanel`'s; everything else is resolved here.
 *
 * ── WHY INLINE ───────────────────────────────────────────────────────────────
 *
 * The colours are ramp stops (`menu-palette.ts`) that exist as no CSS variable,
 * and the geometry has to agree with them. A caller's `style` comes last and
 * overrides any of it.
 */
import type { MenuPalette } from '../floating/menu-palette';
import type { WebCssStyle } from '../styles/web-view-style';

/** `w-[266px]` — the one panel width every floating surface shares. */
export const POPOVER_WIDTH = 266;
/** `rounded-2xl`. */
export const POPOVER_RADIUS = 16;
/** `p-2.5` — also what `PopoverSeparator` bleeds back through. */
export const POPOVER_PADDING = 10;
/** `max-w-[calc(100vw-32px)]`, as the 32px it subtracts. */
export const POPOVER_VIEWPORT_INSET = 32;
/** Popovers sit `offset={8}` from their trigger. */
export const POPOVER_SIDE_OFFSET = 8;

/**
 * The panel's inline chrome. `maxWidth` is only the default: a numeric
 * `maxWidth` PROP is applied by `FloatingPanel` and must not be overwritten, so
 * the caller passes `viewportWidth` only when no prop was given.
 */
export function resolvePopoverSurfaceStyle(
  palette: MenuPalette,
  viewportWidth?: number,
  padding = POPOVER_PADDING,
): WebCssStyle {
  // Longhands, one side at a time: a caller's `style` override of one side must
  // not lose to a shorthand react-native-web ranks above it (AGENTS.md,
  // "Style").
  //
  // FloatingPanel owns the bounded ScrollArea. This outer surface clips material
  // and content to its radius; consumers do not install a second scroller.
  const style: WebCssStyle = {
    width: POPOVER_WIDTH,
    ...(viewportWidth !== undefined
      ? { maxWidth: Math.max(0, viewportWidth - POPOVER_VIEWPORT_INSET) }
      : null),
    paddingTop: padding,
    paddingBottom: padding,
    paddingLeft: padding,
    paddingRight: padding,
    borderRadius: POPOVER_RADIUS,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    boxShadow: palette.shadow,
    overflow: 'hidden',
  };
  return style;
}
