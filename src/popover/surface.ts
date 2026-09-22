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

export type PopoverChromeKey =
  | 'width'
  | 'maxWidth'
  | 'paddingTop'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'paddingRight'
  | 'radius'
  | 'borderWidth'
  | 'borderColor'
  | 'background'
  | 'shadow'
  | 'overflow'
  // The rest are the PANEL PARTS' chrome (`parts.tsx`). The panel itself sets
  // no default for any of them, so `resolvePopoverSurfaceStyle` ignores them.
  | 'color'
  | 'gap'
  | 'marginTop'
  | 'marginBottom'
  | 'marginLeft'
  | 'marginRight'
  | 'height'
  | 'flexDirection'
  | 'alignItems';

const BORDER_WIDTH = /^border(-[xytrblse])?(-\d+(\.\d+)?|-\[[^\]]+px\])?$/;

/**
 * The sides a spacing utility's axis letter claims. `p-4` has no letter and
 * claims all four; `px`/`py` are the pairs; `pt`/`pb`/`pl`/`pr` are single
 * sides. `ps`/`pe` are the LOGICAL start and end — one side each, not the
 * pair — which react-native-web resolves to left and right in an LTR
 * document. Treating them as the pair would drop a default the caller never
 * asked to own.
 */
function sidesOf(letter: string | undefined, property: 'padding' | 'margin'): PopoverChromeKey[] {
  const sides =
    letter === undefined ? ['Top', 'Bottom', 'Left', 'Right']
    : letter === 'x' ? ['Left', 'Right']
    : letter === 'y' ? ['Top', 'Bottom']
    : letter === 't' ? ['Top']
    : letter === 'b' ? ['Bottom']
    : letter === 'l' || letter === 's' ? ['Left']
    : letter === 'r' || letter === 'e' ? ['Right']
    : [];
  return sides.map((side) => `${property}${side}` as PopoverChromeKey);
}

/**
 * Which chrome properties a caller's utility classes set. Variants (`dark:`,
 * `md:`, `hover:`), the important `!` and a negative `-` are stripped first, so
 * `md:!p-0` counts as padding.
 *
 * Padding and margin are claimed PER SIDE, because the utilities are: `px-4`
 * names left and right and says nothing about the top, so a part that also
 * sets `paddingTop` must keep it. Treating them as one key dropped a header's
 * `pt-1` for a caller who only asked for wider sides.
 *
 * `text-*` is counted as a COLOUR, including the size steps (`text-sm`). That
 * is deliberately imprecise: telling `text-sm` from `text-red-500` means
 * knowing the consumer's palette, and the alternative the parts used before
 * this — drop the colour default whenever ANY `className` is passed — is
 * strictly worse, since it loses the colour to an unrelated `mt-1`.
 */
export function classChromeOverrides(className?: string): ReadonlySet<PopoverChromeKey> {
  const keys = new Set<PopoverChromeKey>();
  if (!className) return keys;
  let spacing: RegExpExecArray | null;
  for (const raw of className.split(/\s+/)) {
    if (!raw) continue;
    const token = raw.slice(raw.lastIndexOf(':') + 1).replace(/^!/, '').replace(/^-/, '');
    if (/^(w|size)-/.test(token)) keys.add('width');
    else if (/^max-w-/.test(token)) keys.add('maxWidth');
    else if ((spacing = /^([pm])([xytrbles])?-/.exec(token))) {
      const property = spacing[1] === 'p' ? 'padding' : 'margin';
      for (const key of sidesOf(spacing[2], property)) keys.add(key);
    }
    else if (/^rounded(-|$)/.test(token)) keys.add('radius');
    else if (BORDER_WIDTH.test(token)) keys.add('borderWidth');
    else if (/^border-/.test(token)) keys.add('borderColor');
    else if (/^bg-/.test(token)) keys.add('background');
    else if (/^shadow(-|$)/.test(token)) keys.add('shadow');
    else if (/^overflow-/.test(token)) keys.add('overflow');
    else if (/^text-/.test(token)) keys.add('color');
    else if (/^gap(-|$)/.test(token)) keys.add('gap');
    else if (/^h-/.test(token)) keys.add('height');
    else if (/^flex-(row|col)/.test(token)) keys.add('flexDirection');
    else if (/^items-/.test(token)) keys.add('alignItems');
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
  // Longhands, one side at a time: a caller's `style` override of one side must
  // not lose to a shorthand react-native-web ranks above it (AGENTS.md,
  // "Style"), and a caller who writes `px-4` is claiming the sides, not the top.
  if (!overridden.has('paddingTop')) style.paddingTop = POPOVER_PADDING;
  if (!overridden.has('paddingBottom')) style.paddingBottom = POPOVER_PADDING;
  if (!overridden.has('paddingLeft')) style.paddingLeft = POPOVER_PADDING;
  if (!overridden.has('paddingRight')) style.paddingRight = POPOVER_PADDING;
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
