import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

import type { AvatarColor } from '../avatar/types';

/** One person in the 2 × 2 grid. */
export interface RecentHire {
  /** Stable key; defaults to `name`. */
  id?: string;
  name: string;
  /** When they joined, pre-formatted (`"Joined today"`, `"2 days ago"`). */
  joined: string;
  /** The role chip's label (`"Backend Engineer"`). */
  role: string;
  /** Photo. Without one the avatar shows `initials` on `avatarColor`. */
  avatar?: string | ImageSourcePropType;
  /** Defaults to the first letters of the first two words of `name`. */
  initials?: string;
  avatarColor?: AvatarColor;
}

export interface RecentHiresCardProps {
  /** The people cards, in order. The card has room for four (2 × 2). */
  hires: readonly RecentHire[];
  /** Muted label over the count. Default `"Recent hires"`. */
  title?: string;
  /** The headline number, pre-formatted or raw (`56`). */
  count: string | number;
  /** The team switcher's label, top right (`"Design team"`). Omit for no switcher. */
  teamLabel?: string;
  onTeamPress?: () => void;
  /** Accessible name of the team switcher. Defaults to `teamLabel`. */
  teamAccessibilityLabel?: string;
  /** Default `"Previous"`. */
  previousLabel?: string;
  /** Default `"Next"`. */
  nextLabel?: string;
  onPreviousPress?: () => void;
  onNextPress?: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  /**
   * Fixed card height. Default 329 (the chart cards' height); `'auto'`
   * sizes it to its content.
   */
  height?: number | 'auto';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
