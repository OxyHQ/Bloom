import type { Animated } from 'react-native';
import type { CollapsibleProps } from './types';

export interface CollapsibleFrameProps extends Omit<
  CollapsibleProps,
  'transition'
> {
  progress: Animated.Value;
  hidden: boolean;
  /** Accordion supplies its real relationship; standalone Collapsible supplies neither. */
  labelledBy?: string;
  returnFocusId?: string;
  region?: boolean;
}
