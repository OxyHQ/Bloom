/**
 * Composite type steps for the menu, select and tooltip surfaces.
 *
 * Each menu line is set with one step of Bloom's ramp (`TYPE_SCALE`: body,
 * body-2, caption), which carries size, line height, tracking AND weight
 * together; this module pairs a step with the `sans` face. `fontFamily` is
 * always set: without it the line renders in the browser's system stack.
 */
import { Platform, type TextStyle } from 'react-native';

import { TYPE_SCALE, type TypeScaleVariant } from '../typography/scale';

/** Bloom's `sans` face (Inter): the CSS variable on web, the registered family on native. */
export const MENU_FONT_FAMILY: TextStyle =
  Platform.OS === 'web' ? { fontFamily: 'var(--bloom-font-sans)' } : { fontFamily: 'Inter' };

/** The inline type for one ramp step: the whole step plus Inter. */
export function menuType(variant: TypeScaleVariant): TextStyle {
  return { ...TYPE_SCALE[variant], ...MENU_FONT_FAMILY };
}
