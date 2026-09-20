import type { NoteEditorToolbarProps } from './types';

/**
 * `ButtonGroup`'s own item heights, restated.
 *
 * The toolbar has to know how wide one item is BEFORE it renders it, because
 * that is what decides how many fit — and `button-group`'s `GEOMETRY` table is
 * private to that family. Restating two numbers is the smaller evil than
 * measuring every item and reflowing, but it is a copy: if `ButtonGroup`'s rungs
 * move, `NoteEditorToolbar.test.tsx`'s capacity assertions are what goes red,
 * and the fix is to export the table rather than to edit these.
 */
export const TOOLBAR_ITEM_SIZE: Record<NonNullable<NoteEditorToolbarProps['size']>, number> = {
  medium: 34,
  small: 30,
};

/** The group's own 1px border, both sides. */
export const TOOLBAR_GROUP_BORDER = 2;

/** The 1px hairline `ButtonGroup` draws BETWEEN items (never at the ends). */
export const TOOLBAR_DIVIDER = 1;
