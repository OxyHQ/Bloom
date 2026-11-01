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
  /** The actions it supports, its preferred one first. Default: `['copy']`. */
  actions?: readonly DragAction[];
  /** Its preferred action, when not the first of `actions`. */
  preferredAction?: DragAction;
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
