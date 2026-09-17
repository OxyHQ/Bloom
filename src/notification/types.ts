import type React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { AvatarProps } from '../avatar';
import type { ButtonVariant } from '../button';
import type { BloomIconComponent } from '../icons/icon-component';

/**
 * `warning` is Bloom's addition to `neutral | information | success | error`,
 * so the toast's `warning` variant has a disc of its own.
 */
export type NotificationStatus = 'neutral' | 'information' | 'success' | 'warning' | 'error';

export type NotificationPresence = 'online' | 'busy' | 'offline';

/** A leading glyph component — pass the component (`RiMailFill`), not an element. */
/** @deprecated Use `BloomIconComponent` from `@oxy.so/bloom/icons`; this is an alias of it. */
export type NotificationIconComponent = BloomIconComponent;

/** Avatar leading visual. `size` is fixed at 40 by the card. */
export type NotificationAvatar = Omit<AvatarProps, 'size'> & {
  /** Presence dot on the avatar's bottom-right. */
  presence?: NotificationPresence;
};

export interface NotificationAction {
  label: React.ReactNode;
  onPress?: () => void;
  /** Defaults to `secondary` for the first action and `primary` after it. */
  variant?: ButtonVariant;
}

export interface NotificationProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Muted text after the title, e.g. `2m ago`. */
  timestamp?: React.ReactNode;
  /** Colours the leading disc. Defaults to `neutral`. */
  status?: NotificationStatus;
  /** Custom leading glyph. Defaults to the icon associated with `status`. */
  icon?: NotificationIconComponent;
  /** Avatar leading visual. Takes precedence over `icon`. */
  avatar?: NotificationAvatar;
  /** Small action buttons below the message. */
  actions?: NotificationAction[];
  /** Show the close button. Defaults to `true`. */
  dismissible?: boolean;
  /** Accessible name of the close button. Defaults to `Dismiss notification`. */
  closeLabel?: string;
  /** Called after the dismiss exit animation completes. */
  onDismiss?: () => void;
  /**
   * Dismiss automatically after this many milliseconds, drawing a 3px accent
   * countdown bar along the bottom edge for the same duration.
   */
  autoDismissDuration?: number;
  /** Opt into the entrance animation, after this many SECONDS. */
  introDelay?: number;
  /**
   * The live-region role. Defaults to `alert` for `error` and `status` for the
   * rest.
   */
  role?: 'alert' | 'status';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
