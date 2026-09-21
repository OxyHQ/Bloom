import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import type { TabBarItem } from '../tab-bar/types';

export interface BottomBarProps {
  items: TabBarItem[];
  value: string;
  onValueChange: (value: string) => void;
  /** Static action sibling; outside the navigation scrub detector. */
  action?: ReactNode;
  /** Auto places the action above navigation when side-by-side targets would be cramped. */
  actionPlacement?: 'auto' | 'beside' | 'above';
  /** Hide the accessory while minimizing, returning on upward scroll. Default hide; standalone actions remain visible. */
  actionBehavior?: 'hide' | 'visible';
  material?: 'solid' | 'translucent';
  minimizeProgress?: SharedValue<number>;
  blur?: boolean;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
