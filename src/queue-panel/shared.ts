import { Platform } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { resolveMenuPalette } from '../floating/menu-palette';
import type { Theme } from '../theme/types';
import type { QueuePanelLabels } from './types';

export const IS_WEB = Platform.OS === 'web';

/** Every row is exactly this tall, so a drag offset converts to an index with no measuring. */
export const QUEUE_ROW_HEIGHT = 56;
export const QUEUE_COVER_SIZE = 40;

export const DEFAULT_QUEUE_PANEL_LABELS: QueuePanelLabels = {
  queueTab: 'Queue',
  recentTab: 'Recently played',
  close: 'Close queue',
  nowPlaying: 'Now playing',
  nextInQueue: 'Next in queue',
  nextFrom: (context) => `Next from: ${context}`,
  nextUp: 'Next up',
  clearQueue: 'Clear queue',
  play: 'Play',
  moreOptions: (title) => `More options for ${title}`,
  reorder: (title) => `Reorder ${title}`,
  reorderHint: 'Drag, or use the arrow keys',
  moveUp: 'Move up',
  moveDown: 'Move down',
  remove: 'Remove from queue',
  moved: (title, position, total) => `${title} moved to position ${position} of ${total}`,
  emptyQueue: 'Your queue is empty',
  emptyQueueHint: 'Add songs and episodes to hear them next.',
  emptyRecent: 'Nothing played yet',
};

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(index)));
}

/**
 * `list` with the item at `from` moved to `to` (both clamped into range). Always
 * a new array; an out-of-range or no-op move returns an unchanged copy.
 */
export function moveQueueItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = list.slice();
  if (list.length === 0 || from < 0 || from >= list.length) return next;
  const target = clampIndex(to, list.length);
  if (target === from) return next;
  const [item] = next.splice(from, 1);
  next.splice(target, 0, item as T);
  return next;
}

/** The index a row dragged `dy` px from `from` lands on: nearest whole row, clamped. */
export function queueDragTarget(from: number, dy: number, rowHeight: number, count: number): number {
  if (count <= 0 || rowHeight <= 0) return 0;
  return clampIndex(from + dy / rowHeight, count);
}

/**
 * How far a row that is NOT being dragged slides to make room, while the row at
 * `from` hovers over `target`: rows between the two move one row towards `from`.
 */
export function queueDragShift(index: number, from: number, target: number, rowHeight: number): number {
  if (index === from) return 0;
  if (from < target && index > from && index <= target) return -rowHeight;
  if (target < from && index >= target && index < from) return rowHeight;
  return 0;
}

export function isImageUrl(value: string): boolean {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('file:')
  );
}

export interface QueuePanelPaint {
  surface: string;
  border: string;
  rowHover: string;
  /** A glyph button under the pointer, one step above the row highlight. */
  buttonHover: string;
  /** The lifted row while dragging. */
  dragSurface: string;
  dragShadow: string;
  placeholder: string;
  placeholderGlyph: string;
  text: string;
  textSecondary: string;
  accent: string;
  ring: string;
}

/** Every colour the family paints, from the theme. The panel is the menu surface family. */
export function resolveQueuePanelPaint(theme: Theme): QueuePanelPaint {
  const menu = resolveMenuPalette(theme);
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  return {
    surface: menu.surface,
    border: menu.border,
    rowHover: menu.rowHighlight,
    buttonHover: dark ? n[600] : n[200],
    dragSurface: dark ? n[700] : theme.colors.card,
    dragShadow: dark
      ? '0 8px 24px rgba(0, 0, 0, 0.45)'
      : '0 8px 24px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.06)',
    placeholder: dark ? n[700] : n[100],
    placeholderGlyph: dark ? n[400] : n[400],
    text: theme.colors.text,
    textSecondary: menu.textSecondary,
    accent: dark ? accent[400] : accent[600],
    ring: accent[500],
  };
}

// ---------------------------------------------------------------------------
//  Web CSS — hover reveal, focus rings and the grab cursor have no inline-style
//  spelling, so they hang off `dataSet` attributes in one adopted sheet.
// ---------------------------------------------------------------------------

export const QUEUE_PANEL_STYLE_ID = 'bloom-queue-panel-web-css';

const ROW = '[data-bloom-queue-row]';
const REVEAL = '[data-bloom-queue-reveal]';
const FOCUSABLE = '[data-bloom-queue-focusable]';
const HANDLE = '[data-bloom-queue-handle]';

export const QUEUE_PANEL_CSS = `
${ROW} ${REVEAL} {
  opacity: 0;
}
${ROW}:hover ${REVEAL},
${ROW}:focus-within ${REVEAL},
${ROW}[data-bloom-queue-row="active"] ${REVEAL} {
  opacity: 1;
}
@media (hover: none) {
  ${ROW} ${REVEAL} {
    opacity: 1;
  }
}
${FOCUSABLE} {
  outline: none;
  cursor: pointer;
  user-select: none;
}
${FOCUSABLE}:focus-visible {
  outline: 2px solid var(--bloom-queue-ring, currentColor);
  outline-offset: -2px;
}
${HANDLE} {
  cursor: grab;
  touch-action: none;
}
${ROW}[data-bloom-queue-row="dragging"] ${HANDLE} {
  cursor: grabbing;
}
`;
