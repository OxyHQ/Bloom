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
  /** Status label, e.g. "Thinking" or "Searching the docs". Default `'Thinking'`. */
  label?: string;
  /** Tone of the indicator + label. Defaults per variant (`stars` is `subtle`, the rest `default`). */
  tone?: AgentThinkingTone;
  /** Highlight travelling across the label (web; static tone on native). Default `true`. */
  shimmer?: boolean;
  /** Elapsed seconds since mount (`12.3s`), rendered after the label. Default `true`. */
  showTimer?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
