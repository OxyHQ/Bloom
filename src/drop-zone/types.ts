import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type {
  DragAction,
  DropKind,
  DropTargetDragEvent,
  DropTargetDropEvent,
} from '../platform-surface/types';

/**
 * A view that takes what the person drops on it from another application (a
 * file manager's files, a browser's link or image, text) or from this one.
 *
 * On the web it is HTML5's drag and drop on its element: during the drag a
 * page sees what kinds are offered, never the content, which arrives at the
 * drop (the browser's protected mode). On a platform whose adapter reports
 * `drag-and-drop` (OxyOS) it is the platform's drop target. Elsewhere (a phone
 * today) it is a view that takes nothing.
 */
export interface DropZoneProps {
  /** The kinds of content it takes: `files`, `text`, `url`, `html`, or media types. */
  accept: readonly DropKind[];
  /**
   * The media types of files it takes (`image/png`, `image/*`), case and
   * parameters ignored: a drag of files is taken only when every file dragged
   * is of one of them (an application's icon that lights only for documents it
   * opens). A drag whose files' types are unknown is not taken. Absent: any.
   */
  acceptFileTypes?: readonly string[];
  /** The actions it supports, its preferred one first. Default: `['copy']`. */
  actions?: readonly DragAction[];
  /** Its preferred action, when not the first of `actions`. */
  preferredAction?: DragAction;
  /**
   * The folder files dropped on it go into, as a `file://` URI. Where the
   * platform knows the volume each dragged file is on (OxyOS), a drag of files
   * prefers a move when every one is on this folder's volume and a copy when
   * any is not, as Finder does; Option still forces a copy and Command a move.
   * It matters only when `actions` allows both. Ignored on the web, whose
   * drags name no folders.
   */
  folder?: string;
  /** Takes nothing while true. */
  disabled?: boolean;
  /** A drag it would take entered it. */
  onDragEnter?: (event: DropTargetDragEvent) => void;
  /** A drag it would take moved over it. */
  onDragOver?: (event: DropTargetDragEvent) => void;
  /** The drag left it, was dropped elsewhere or was cancelled. */
  onDragLeave?: () => void;
  /** Dropped on it: the action and the content, of the kinds it accepts. */
  onDrop: (event: DropTargetDropEvent) => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
  children?: ReactNode;
}

/** How an HTML5 drag's image is made from the dragged element (`setDragImage`). */
export interface DragImageOptions {
  /** The point pressed in the element (its own pixels from its top left), kept under the pointer. */
  readonly x: number;
  readonly y: number;
  /** How many items are dragged, the element showing one of them. Above one, stacked and badged. Default 1. */
  readonly count?: number;
}

/** What `useWindowDrag` tells: a drag over the window, from any application. */
export interface WindowDragHandlers {
  /** A drag first came over the window. */
  onEnter?: () => void;
  /**
   * The drag left the window or ended. `dropped` is true when it was dropped
   * on this window, told after that drop's `onDrop`.
   */
  onExit?: (dropped: boolean) => void;
}
