import type { ReactNode, Ref } from 'react';
import type { StyleProp, View, ViewStyle } from 'react-native';

import type { BloomSize } from '../appearance/types';

/** Header and body geometry; the control sizes `Button` has for its header. */
export type ReasoningSize = Exclude<BloomSize, 'xs'>;

export interface ReasoningProps {
  /**
   * The model's reasoning: text or nodes. A string that grows as tokens arrive
   * is fine, the body re-renders with it.
   */
  children?: ReactNode;
  /**
   * The model is still reasoning. The header shows the `AgentThinking`
   * indicator and label, and the body opens. When it turns false the body
   * closes again, unless the user opened or closed it meanwhile.
   */
  streaming?: boolean;
  /**
   * How long the model reasoned, in ms, for the finished header ("Thought for
   * 12 s"). Rounded to whole seconds; without it the header reads "Reasoning".
   */
  durationMs?: number;
  /** Controlled open state. Automatic open/close on `streaming` is reported through `onOpenChange`. */
  open?: boolean;
  /** Initial open state when uncontrolled. Defaults to `streaming`. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Header and body size. Defaults to the enclosing `BloomScope`'s, then `md`. */
  size?: ReasoningSize;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  ref?: Ref<View>;
}
