/**
 * Composite type steps for the menu, select and tooltip surfaces.
 *
 * Each menu line is set with one of the `text-*` ramp utilities
 * (`text-body-medium`, `text-body-2-medium`, `text-caption-1-medium`), which
 * carry size, line height, tracking AND weight together, in Inter. Bloom's
 * ramp for this is `TYPE_SCALE`; this module pairs a step with the `sans` face.
 *
 * Applied INLINE, and only while the caller passes no `className` (Bloom
 * AGENTS.md, "Style and className": inline type keys would silently outrank a
 * caller's `text-*` / `font-*` utilities). With a caller class the part falls
 * back to the matching Tailwind spelling (`MENU_TYPE_CLASS`) so the caller's
 * utilities still cascade over a sized base. `fontFamily` always stays inline —
 * without it the line renders in the browser's system stack, which is exactly
 * the bug an earlier class-only version shipped.
 */
import { Platform, type TextStyle } from 'react-native';

import { TYPE_SCALE, type TypeScaleVariant } from '../typography/scale';

/** Bloom's `sans` face (Inter): the CSS variable on web, the registered family on native. */
export const MENU_FONT_FAMILY: TextStyle =
  Platform.OS === 'web' ? { fontFamily: 'var(--bloom-font-sans)' } : { fontFamily: 'Inter' };

/** The Tailwind spelling of each step, used only under a caller `className`. */
export const MENU_TYPE_CLASS: Partial<Record<TypeScaleVariant, string>> = {
  'body-medium': 'text-sm font-medium',
  'body-regular': 'text-sm',
  'body-2-medium': 'text-[13px]/[18px] font-medium',
  'caption-1-medium': 'text-xs font-medium',
  'caption-1-regular': 'text-xs',
};

/**
 * The inline type for one ramp step: the whole step plus Inter without a caller
 * `className`, Inter alone with one.
 */
export function menuType(variant: TypeScaleVariant, callerClassName?: string): TextStyle {
  return callerClassName?.trim()
    ? MENU_FONT_FAMILY
    : { ...TYPE_SCALE[variant], ...MENU_FONT_FAMILY };
}

/** The class half of the same contract: the step's utilities, only under a caller class. */
export function menuTypeClass(
  variant: TypeScaleVariant,
  callerClassName?: string,
): string | false {
  return Boolean(callerClassName?.trim()) && (MENU_TYPE_CLASS[variant] ?? false);
}
