/**
 * The toolbar's collapse arithmetic, and the header's status paint — both pure,
 * so the suite can walk them without rendering and without a browser.
 */
import { resolveAccentColors } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import { surfaceTextOn } from '../styles/surface-levels';
import { TOOLBAR_DIVIDER, TOOLBAR_GROUP_BORDER, TOOLBAR_ITEM_SIZE } from './constants';
import type { NoteEditorAction, NoteEditorToolbarProps, NoteSaveState } from './types';

/**
 * How many `ButtonGroup` items fit in `width`.
 *
 * A solid group is `1px border + n items + (n-1) hairlines + 1px border`, so
 * every item after the first costs `item + 1` and the first costs `item + 2`.
 * Solved for `n` and floored — a fractional item is not an item.
 *
 * Returns 0 for a width that cannot hold one, which is a real case at the
 * bottom of a split pane and not something to clamp away.
 */
export function toolbarCapacity(
  width: number,
  size: NonNullable<NoteEditorToolbarProps['size']> = 'medium',
): number {
  const item = TOOLBAR_ITEM_SIZE[size];
  const usable = width - TOOLBAR_GROUP_BORDER + TOOLBAR_DIVIDER;
  return Math.max(0, Math.floor(usable / (item + TOOLBAR_DIVIDER)));
}

export interface ToolbarSplit {
  /** Drawn in the row, in order. */
  inline: ReadonlyArray<NoteEditorAction>;
  /** Drawn in the overflow menu, in order. */
  overflow: ReadonlyArray<NoteEditorAction>;
}

/**
 * Split the actions into what the row draws and what the menu gets.
 *
 * Two rules, and they are the whole design:
 *
 *  - **`alwaysVisible` never collapses.** Those actions are drawn first and are
 *    not candidates for the menu, so a toolbar whose author pinned six of them
 *    at 360px overflows rather than quietly hiding one. The toolbar cannot
 *    collapse what it was told to keep, and pretending otherwise is worse.
 *  - **The overflow button costs a slot.** As soon as anything moves to the
 *    menu, one item's worth of width goes to the `…` — so the capacity the
 *    remaining actions are measured against is one lower. Forgetting that is
 *    how an adaptive row ends up one item too wide at exactly the width where
 *    it starts collapsing.
 *
 * `capacity` of `null` means "not measured yet": everything is inline, which is
 * the state the first frame renders in.
 */
export function splitToolbarActions(
  actions: ReadonlyArray<NoteEditorAction>,
  capacity: number | null,
): ToolbarSplit {
  if (capacity === null) return { inline: actions, overflow: [] };
  const pinned = actions.filter((action) => action.alwaysVisible === true);
  const rest = actions.filter((action) => action.alwaysVisible !== true);
  if (pinned.length + rest.length <= capacity) return { inline: actions, overflow: [] };
  const room = Math.max(0, capacity - 1 - pinned.length);
  const kept = rest.slice(0, room);
  const dropped = rest.slice(room);
  // Drawing order is the caller's order, not pinned-then-rest: an author who
  // wrote bold, italic, list expects to read bold, italic, list.
  const keptKeys = new Set([...pinned, ...kept].map((action) => action.key));
  return {
    inline: actions.filter((action) => keptKeys.has(action.key)),
    overflow: dropped,
  };
}

export interface NoteEditorStatusPaint {
  /** The colour the state word and its glyph are drawn in. */
  color: string;
  /** The quiet rung the rest of the line sits at. */
  quiet: string;
}

/**
 * The status line's two colours, measured against the surface the header
 * actually sits on.
 *
 * `saved` and `saving` are quiet — a document that is doing what it is supposed
 * to should not shout — and they take the AA text rung off the real surface
 * rather than a ramp stop. `offline` and `error` take the TONE's text member
 * (`resolveAccentColors(..., 'outlined').foreground`), never the fill token: a
 * fill is sized to carry white, and using it as a label is how a warning line
 * ends up at 3.6:1 in dark mode.
 */
export function resolveNoteStatusPaint(
  theme: Theme,
  surface: string,
  state: NoteSaveState | undefined,
): NoteEditorStatusPaint {
  const quiet = surfaceTextOn(theme, surface).textTertiary;
  if (state === 'offline') {
    return { color: resolveAccentColors(theme.colors, 'warning', 'outlined').foreground, quiet };
  }
  if (state === 'error') {
    return { color: resolveAccentColors(theme.colors, 'error', 'outlined').foreground, quiet };
  }
  return { color: quiet, quiet };
}
