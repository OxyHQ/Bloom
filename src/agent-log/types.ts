import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

export interface AgentLogRevealProps {
  children: ReactNode;
  /**
   * Skip the reveal and render settled. Defaults to the system reduced-motion
   * setting (`useAgentLogMotion()`); pass it once from the log root so every
   * unit agrees.
   */
  reduce?: boolean;
  /** Semantic role of the unit. `AgentLogRow` passes `'listitem'`. */
  role?: 'listitem' | 'none';
  /** Called once the reveal has fully settled (never under `reduce`). */
  onRevealed?: () => void;
  /**
   * Style of the CONTENT box (inside the clip). Put padding here; the clip
   * itself only animates height, opacity, lift and blur.
   */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AgentLogRowProps {
  /** First row of its list: its branch starts with the row instead of waiting for a tail above. */
  first: boolean;
  /** Last row of its list: no trunk below the corner, so the guide ends on it. */
  last: boolean;
  reduce?: boolean;
  /** Content-box style. The default left inset is 16 (`paddingLeft`); override the longhand. */
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  testID?: string;
}

export interface AgentLogRowConnectorProps {
  first: boolean;
  last: boolean;
  reduce?: boolean;
}

export interface AgentLogGuideBridgeProps {
  /** How far up the bridge reaches, px — the gap between the parent glyph and the nested list. */
  height: number;
  /** Distance from the wrapper's left edge to the nested trunk. Default 8. */
  offset?: number;
  reduce?: boolean;
}

export interface AgentLogWorkingRowProps {
  /** The in-progress line, e.g. "Searching the web". */
  label: string;
  reduce?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AgentLogShimmerTextProps {
  /** Must be a plain string: it is also the accessible label. */
  children: string;
  style?: StyleProp<TextStyle>;
}

export interface AgentLogRevealTickerOptions {
  /** How many units the log has in total. */
  total: number;
  /** Pauses and resumes. Toggling back resumes; change `key` to replay. Default `true`. */
  run?: boolean;
  /** ms between units. Default 850. */
  stepInterval?: number;
  /** ms before the first unit. Default 320. */
  startDelay?: number;
  /** Drive it yourself from real events; disables the internal timer. */
  revealed?: number;
  /**
   * Per-unit pacing: given the index about to be revealed, how long to wait
   * first. Overrides `startDelay` and `stepInterval`.
   */
  delayFor?: (index: number) => number;
  /** Fires once when the last unit lands. */
  onComplete?: () => void;
}
