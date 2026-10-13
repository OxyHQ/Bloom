import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * - `wave`     3×3 dot grid, a diagonal wavefront gliding top-left → bottom-right
 * - `spin`     3×3 dot grid, a bright head orbiting the grid clockwise
 * - `stars`    five sparkles twinkling in and out on a stagger
 * - `infinity` a comet trail sweeping a figure-eight
 */
export type AgentThinkingVariant = 'wave' | 'spin' | 'stars' | 'infinity';

/**
 * Colour of the indicator AND the label:
 * `subtle` text-tertiary, `default` text-secondary, `primary` text-primary,
 * `accent` the theme's accent-500.
 */
export type AgentThinkingTone = 'subtle' | 'default' | 'primary' | 'accent';

export interface AgentThinkingProps {
  /** Default `'wave'`. */
  variant?: AgentThinkingVariant;
  /** Status label, e.g. "Thinking" or "Searching the docs". `'Thinking'` in English. */
  label?: string;
  /** Tone of the indicator + label. Defaults per variant (`stars` is `subtle`, the rest `default`). */
  tone?: AgentThinkingTone;
  /** Highlight travelling across the label (web; static tone on native). Default `true`. */
  shimmer?: boolean;
  /** Elapsed seconds since mount (`12.3s`), rendered after the label. Default `true`. */
  showTimer?: boolean;
  /**
   * Still reasoning. `false` is the finished header: no indicator, shimmer or
   * timer, just "Thought for 12 s" (`durationMs`), "Thought for a moment" under
   * half a second, or "Reasoning" with no duration. Default `true`.
   */
  thinking?: boolean;
  /** How long the model reasoned, in ms, for the finished header. Rounded to whole seconds. */
  durationMs?: number;
  /**
   * The model's reasoning: text or nodes. Giving it turns the row into a
   * disclosure (a button with a chevron) with this folded under it. It opens
   * while `thinking` and shuts when thinking ends, unless the user got there
   * first. A string that grows token by token is fine. The timer is off in this
   * mode (it would change the button's name every tenth of a second) unless you
   * pass `showTimer`.
   */
  children?: ReactNode;
  /** Controlled open state of the disclosure. Automatic open/close is reported through `onOpenChange`. */
  open?: boolean;
  /** Initial open state when uncontrolled. Defaults to `thinking`. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
