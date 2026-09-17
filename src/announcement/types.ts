import type React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** A leading glyph component — pass the component (`RiSparklingFill`), not an element. */
export type AnnouncementIconComponent = React.ComponentType<{
  width?: number;
  height?: number;
  fill?: string;
}>;

export interface AnnouncementProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Leading 20px glyph. Defaults to the shield-star (`RiShieldStarFill`). */
  icon?: AnnouncementIconComponent;
  /** CTA label. When set, a full-width small secondary Button is rendered. */
  actionLabel?: React.ReactNode;
  onAction?: () => void;
  /** Show the close button in the top-right corner. Defaults to `false`. */
  dismissible?: boolean;
  /** Called once the dismiss exit animation has finished and the card unmounted. */
  onClose?: () => void;
  /** Accessible name of the close button. Defaults to `Dismiss`. */
  closeLabel?: string;
  /** Opt into the entrance animation, after this many SECONDS. */
  introDelay?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
