import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { Props as IconProps } from '../icons/shared';

export interface TaskListChip {
  /** Chip label, e.g. a file name. */
  label: string;
  /** Optional leading glyph — a file-type or product mark, sized by the caller (slot 14×14). */
  icon?: ReactNode;
}

export interface TaskListStep {
  /** The line of text, e.g. `Scanning 52 files`. Plain text: it is also the shimmer's label. */
  label: string;
  /** Resource chips rendered inline after the label. */
  chips?: ReadonlyArray<TaskListChip>;
}

export interface TaskListTask {
  /** Title once every step has landed, e.g. `Found project files`. */
  title: string;
  /** Title while steps are still arriving. Falls back to `title`. */
  runningTitle?: string;
  /** Leading glyph for the task header (drawn 16px, icon-secondary). */
  icon?: ComponentType<IconProps>;
  steps: ReadonlyArray<TaskListStep>;
}

export interface TaskListProps {
  tasks: ReadonlyArray<TaskListTask>;
  /**
   * Pauses and resumes the reveal. Hold it false to keep the log from starting
   * on mount, then flip it true when the user sends. Toggling it back resumes
   * where it stopped; to replay from the top, change the element `key`.
   * Default `true`.
   */
  run?: boolean;
  /** Milliseconds between reveals. Default 850. */
  stepInterval?: number;
  /** Milliseconds before the first reveal. Default 320. */
  startDelay?: number;
  /**
   * Drive the reveal yourself from real agent events. Counts units, where each
   * task contributes one header plus one per step. Disables the internal timer.
   */
  revealed?: number;
  /**
   * Collapse finished tasks down to their headers. `true` collapses each task
   * the moment its own steps have landed, so the log tidies itself as it runs.
   * `"all"` instead holds every task open until the whole run lands, then
   * collapses them together as one motion. Default `false`.
   */
  collapseOnComplete?: boolean | 'all';
  /**
   * The indicator at the tail of the log while it is still running, so it
   * always ends on the thing being worked on. Pass a label to change it, or
   * `false` to drop it. Default `'Working'`.
   */
  working?: string | false;
  /** Fires once, after the last step lands. */
  onComplete?: () => void;
  /** Skip every reveal and swap. Defaults to the system reduced-motion setting. */
  reduce?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
