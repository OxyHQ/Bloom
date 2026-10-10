import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the queue panel draws or announces, in each Bloom
 * language — the panel's own words. "Play", "Now playing" come from
 * `MEDIA_CONTROLS_MESSAGES` and "More options for …" from the common words;
 * `queuePanelLabels` assembles all of them into `QueuePanelLabels`, and a
 * caller's `labels` still wins over any entry.
 */
export interface QueuePanelMessages {
  queueTab: string;
  recentTab: string;
  close: string;
  nextInQueue: string;
  /** "Next from: Night Drive". */
  nextFrom: (context: string) => string;
  nextUp: string;
  clearQueue: string;
  /** The drag handle: "Reorder Night Drive". */
  reorder: (title: string) => string;
  reorderHint: string;
  moveUp: string;
  moveDown: string;
  remove: string;
  /** Announced after a move. `position` is 1-based. */
  moved: (title: string, position: number, total: number) => string;
  emptyQueue: string;
  emptyQueueHint: string;
  emptyRecent: string;
}

export const QUEUE_PANEL_MESSAGES: MessageCatalog<QueuePanelMessages> =
  defineMessages<QueuePanelMessages>('QUEUE_PANEL_MESSAGES', {
    queueTab: 'Queue',
    recentTab: 'Recently played',
    close: 'Close queue',
    nextInQueue: 'Next in queue',
    nextFrom: (c) => `Next from: ${c}`,
    nextUp: 'Next up',
    clearQueue: 'Clear queue',
    reorder: (t) => `Reorder ${t}`,
    reorderHint: 'Drag, or use the arrow keys',
    moveUp: 'Move up',
    moveDown: 'Move down',
    remove: 'Remove from queue',
    moved: (t, p, n) => `${t} moved to position ${p} of ${n}`,
    emptyQueue: 'Your queue is empty',
    emptyQueueHint: 'Add songs and episodes to hear them next.',
    emptyRecent: 'Nothing played yet',
  });
