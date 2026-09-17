import type { StyleProp, ViewStyle } from 'react-native';

/** One track in the queue. Every string arrives pre-formatted by the app. */
export interface QueueTrack {
  /** Stable identity: rows are keyed by it, so a reorder keeps keyboard focus. */
  id: string;
  title: string;
  /** "Ilse Marn, The Quiet Coast" — already joined. */
  artists?: string;
  /** Cover art: a URL, or an id the app's `ImageResolver` turns into one. */
  cover?: string;
  /** Draws the explicit badge before the artists. */
  explicit?: boolean;
  /** A trailing meta string: a duration ("3:45") or, in history, when it played ("2 hours ago"). */
  meta?: string;
}

/** The two reorderable lists: what the listener added, and what follows from the playing context. */
export type QueueSection = 'queue' | 'context';

/** The two tabs of the panel. */
export type QueuePanelTab = 'queue' | 'recent';

/** `panel` — a rounded, bordered surface of `width` (web). `sheet` — flat, full width, for a bottom sheet (native). */
export type QueuePanelVariant = 'panel' | 'sheet';

/** Every string the panel draws or announces. Pass any subset to translate. */
export interface QueuePanelLabels {
  queueTab: string;
  recentTab: string;
  close: string;
  nowPlaying: string;
  nextInQueue: string;
  /** Heading of the context list: `nextFrom("Night Drive")` → "Next from: Night Drive". */
  nextFrom: (context: string) => string;
  /** Heading of the context list when no context name is given. */
  nextUp: string;
  clearQueue: string;
  /** Row name prefix: "Play Night Drive". */
  play: string;
  /** The row menu button: "More options for Night Drive". */
  moreOptions: (title: string) => string;
  /** The drag handle: "Reorder Night Drive". */
  reorder: (title: string) => string;
  /** The drag handle's hint. */
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

export interface QueuePanelProps {
  /** The track that is loaded. Omit to hide the section. */
  nowPlaying?: QueueTrack | null;
  /** Animates the now-playing bars. Default `true`. */
  playing?: boolean;
  /** "Next in queue": tracks the listener added. */
  queue?: QueueTrack[];
  /** "Next from": what follows from the playing album, playlist or radio. */
  context?: QueueTrack[];
  /** Name of the playing context, for the heading: "Night Drive". */
  contextName?: string;
  /** The "Recently played" tab's rows, newest first. */
  recentlyPlayed?: QueueTrack[];

  /** Controlled tab. */
  tab?: QueuePanelTab;
  /** Initial tab when uncontrolled. Default `queue`. */
  defaultTab?: QueuePanelTab;
  onTabChange?: (tab: QueuePanelTab) => void;

  /**
   * A row was dragged, moved by keyboard or moved from its menu. Indices are
   * within `section`. The panel draws what it is given — apply the move with
   * `moveQueueItem` and pass the new list back.
   */
  onReorder?: (section: QueueSection, from: number, to: number) => void;
  /** A row's remove action. Omit to hide it. */
  onRemove?: (section: QueueSection, index: number, track: QueueTrack) => void;
  /** A row was pressed. `index` is within `section`; `now` is the now-playing row. */
  onPlay?: (section: QueueSection | 'recent' | 'now', index: number, track: QueueTrack) => void;
  /** "Clear queue" beside "Next in queue". Omit to hide it. */
  onClearQueue?: () => void;
  /** The header's close button. Omit to hide it. */
  onClose?: () => void;

  /** Default: `panel` on web, `sheet` on native. */
  variant?: QueuePanelVariant;
  /** Width of the `panel` variant. Default `360`. */
  width?: number;
  labels?: Partial<QueuePanelLabels>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface RecentlyPlayedListProps {
  items: QueueTrack[];
  onPlay?: (index: number, track: QueueTrack) => void;
  /** Id of the loaded track: its title turns accent and the now-playing bars show. */
  currentId?: string;
  /** Animates the bars on the current row. Default `true`. */
  playing?: boolean;
  labels?: Partial<Pick<QueuePanelLabels, 'play' | 'emptyRecent'>>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface QueuePanelRowProps {
  track: QueueTrack;
  /** Called by pressing the row's main area. */
  onPress?: () => void;
  /** Accent title and now-playing bars. */
  current?: boolean;
  /** Animates the bars while `current`. Default `true`. */
  playing?: boolean;
  /** The name of the row's main area. Default "Play <title>". */
  accessibilityLabel?: string;
  /** Drawn at the trailing edge, after `meta`. */
  trailing?: React.ReactNode;
  /** Keeps the highlight and the revealed trailing controls, e.g. while the row's menu is open. */
  highlighted?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
