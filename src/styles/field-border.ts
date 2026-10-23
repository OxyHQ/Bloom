import type { Theme } from '../theme/types';

/**
 * The field family's resting border, shared by `TextField` (a flush 1px outline
 * under its ring) and `Select`'s trigger, so a text field and a select in one
 * form row draw one outline. Its own module so the menu palette can read it
 * without linking the text-field family.
 */
export const FIELD_REST_BORDER_WIDTH = 1;

export function resolveFieldRestBorder(theme: Theme): string {
  return theme.colors.borderLight;
}
