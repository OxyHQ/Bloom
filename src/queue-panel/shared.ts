import { surfaceFillOn, surfaceTextOn } from '../styles/surface-levels';
import { Platform } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { resolveMenuPalette } from '../floating/menu-palette';
import { dragShift, dragTarget, moveItem } from '../hooks/list-reorder';
import type { Theme } from '../theme/types';
import type { QueuePanelLabels } from './types';
import { COMMON_MESSAGES, type CommonMessages } from '../locale/common-messages';
import { MEDIA_CONTROLS_MESSAGES, type MediaControlsMessages } from '../media-controls/messages';
import { QUEUE_PANEL_MESSAGES, type QueuePanelMessages } from './messages';

export const IS_WEB = Platform.OS === 'web';

/** Every row is exactly this tall, so a drag offset converts to an index with no measuring. */
export const QUEUE_ROW_HEIGHT = 56;
export const QUEUE_COVER_SIZE = 40;

/** Every `QueuePanelLabels` entry in one language, from the three catalogs the panel speaks through. */
export function queuePanelLabels(
  queue: QueuePanelMessages,
  controls: MediaControlsMessages,
  common: CommonMessages,
): QueuePanelLabels {
  return {
    ...queue,
    nowPlaying: controls.nowPlaying,
    play: controls.play,
    moreOptions: (title) => common.labelFor(common.moreOptions, title),
  };
}

/** The English labels; the panel speaks the locale's (`BloomProvider locale`). */
export const DEFAULT_QUEUE_PANEL_LABELS: QueuePanelLabels = queuePanelLabels(
  QUEUE_PANEL_MESSAGES.en,
  MEDIA_CONTROLS_MESSAGES.en,
  COMMON_MESSAGES.en,
);

/**
 * A row's name. The catalog's is a whole phrase ("Play Night Drive", "${title}を再生");
 * a caller who passed its own `play` word keeps the old "<play> <title>" shape.
 * `customPlay` is the CALLER's word or `undefined` — never the merged label, which
 * cannot tell a caller's "再生" from the catalog's.
 */
export function queuePlayName(customPlay: string | undefined, title: string, controls: MediaControlsMessages): string {
  return customPlay === undefined ? controls.playSubject(title) : `${customPlay} ${title}`;
}

/** @deprecated Use `moveItem` from `@oxy.so/bloom/hooks`; this is a re-export of it. */
export const moveQueueItem = moveItem;

/** @deprecated Use `dragTarget` from `@oxy.so/bloom/hooks`; this is a re-export of it. */
export const queueDragTarget = dragTarget;

/** @deprecated Use `dragShift` from `@oxy.so/bloom/hooks`; this is a re-export of it. */
export const queueDragShift = dragShift;


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
  const { accent } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  return {
    surface: menu.surface,
    border: menu.border,
    rowHover: menu.rowHighlight,
    buttonHover: surfaceFillOn(theme, menu.surface),
    dragSurface: surfaceFillOn(theme, menu.surface),
    dragShadow: dark
      ? '0 8px 24px rgba(0, 0, 0, 0.45)'
      : '0 8px 24px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.06)',
    placeholder: surfaceFillOn(theme, menu.surface),
    placeholderGlyph: surfaceTextOn(theme, surfaceFillOn(theme, menu.surface)).textSecondary,
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
