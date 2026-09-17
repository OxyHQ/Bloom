import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { TypeScaleVariant } from '../typography/scale';

/** The module's fixed strings, overridable for localisation. */
export interface AgentProgressLabels {
  /** Header while steps remain. Default `n => \`${n} ${n === 1 ? 'step' : 'steps'} left\``. */
  stepsLeft?: (remaining: number) => string;
  /** Header once every step is done. Default `'All steps completed'`. */
  allCompleted?: string;
  /** Names the minimize button. Default `'Minimize steps'`. */
  minimize?: string;
  /** Names the minimized bar (it expands on press). Default `'Expand steps'`. */
  expand?: string;
}

export interface AgentProgressProps {
  /** Ordered task labels. Defaults to a coding workflow (`DEFAULT_AGENT_PROGRESS_STEPS`). */
  steps?: readonly string[];
  /**
   * Time spent on each step, in ms. Drives the rings; when `completedCount` is
   * uncontrolled it also advances the steps. Default `3000`.
   */
  stepDuration?: number;
  /** Time to keep the completed state visible before calling `onFinished`, ms. Default `1000`. */
  completionDelay?: number;
  /** Called `completionDelay` ms after the last step completes. */
  onFinished?: () => void;
  /**
   * Freezes the clock: no step advances and `onFinished` doesn't fire while
   * true. The module keeps its current state and resumes when it flips back.
   */
  paused?: boolean;
  /**
   * Controlled progress: how many steps are done. When set the internal clock
   * no longer advances steps — the consumer does, as its agent reports them.
   * The rings still animate each step over `stepDuration` as an estimate and
   * jump ahead when a step lands early.
   */
  completedCount?: number;
  /** Controlled minimized state. */
  minimized?: boolean;
  /** Initial minimized state when uncontrolled. Default `false`. */
  defaultMinimized?: boolean;
  onMinimizedChange?: (minimized: boolean) => void;
  labels?: AgentProgressLabels;
  /** Card style (width, margins…). Default card is 341 wide, `max-width: 100%`. */
  style?: StyleProp<ViewStyle>;
  /** Default `'agent-progress'`; parts append `-minimized`, `-expanded`, `-step-<i>`. */
  testID?: string;
}

export interface AgentProgressLoadingTextProps {
  /** The label. A string, so the shimmer can be laid across its characters. */
  children: string;
  /** Type-ramp step. Default `'body-medium'` (the step labels). */
  variant?: TypeScaleVariant;
  /** Text style; its `color` is ignored while the shimmer runs. */
  style?: StyleProp<TextStyle>;
  /** Default `1` (truncates the label). `0` lets it wrap. */
  numberOfLines?: number;
  testID?: string;
}
