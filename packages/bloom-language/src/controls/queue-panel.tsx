import {
  QueuePanel as BloomQueuePanel,
  type QueuePanelProps,
  QueuePanelRow as BloomQueuePanelRow,
  type QueuePanelRowProps,
  type QueueTrack,
  RecentlyPlayedList as BloomRecentlyPlayedList,
  type RecentlyPlayedListProps,
} from '@oxy.so/bloom/queue-panel';

import { type Child, Node, type ViewModifiers } from '../node';
import type { QueuePanelStyle, SpaceToken } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** The play queue: the panel, its row, and what was played. */
export type QueuePanelKind = 'queuePanel' | 'queuePanelRow' | 'recentlyPlayedList';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

/**
 * Bloom `QueuePanel`'s data: the playing track, the queue, the context and
 * what was played, its tab (controlled when given) and its handlers; its
 * panel's width a space token.
 */
export type QueuePanelOptions = Omit<QueuePanelProps, Drawn | 'variant' | 'width'> & {
  readonly width?: SpaceToken;
};
export type QueuePanelRowOptions = Omit<
  QueuePanelRowProps,
  Drawn | 'track' | 'onPress' | 'trailing'
> & { readonly trailing?: Child };
export type RecentlyPlayedListOptions = Omit<RecentlyPlayedListProps, Drawn | 'items'>;

/** Bloom `QueuePanel`. */
export interface QueuePanelView extends ViewModifiers<QueuePanelView> {
  /** `panel` (the web's default) or `sheet` (native's). */
  style(value: QueuePanelStyle): QueuePanelView;
}
/** Bloom `QueuePanelRow`; `.onPress()` plays it, `.label()` names it. */
export type QueuePanelRowView = ViewModifiers<QueuePanelRowView>;
export type RecentlyPlayedListView = ViewModifiers<RecentlyPlayedListView>;

export function QueuePanel(options: QueuePanelOptions = {}): QueuePanelView {
  return new Node('queuePanel', { options }, []);
}
export function QueuePanelRow(
  track: QueueTrack,
  options: QueuePanelRowOptions = {},
): QueuePanelRowView {
  return new Node('queuePanelRow', { track, options }, []);
}
export function RecentlyPlayedList(
  items: readonly QueueTrack[],
  options: RecentlyPlayedListOptions = {},
): RecentlyPlayedListView {
  return new Node('recentlyPlayedList', { items, options }, []);
}

export const QUEUE_PANELS: Record<QueuePanelKind, ControlRenderer> = {
  queuePanel: product(BloomQueuePanel, {
    lengths: ['width'],
    own: (d) => ({ variant: d.own('style')?.value }),
  }),
  queuePanelRow: product(BloomQueuePanelRow, { press: true, slots: ['trailing'] }),
  recentlyPlayedList: product(BloomRecentlyPlayedList),
};
