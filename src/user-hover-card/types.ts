import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** A single labeled metric rendered in the {@link UserHoverCardProps.stats} row. */
export interface UserHoverCardStat {
  /** Human-readable label, e.g. `"Followers"`. */
  label: string;
  /** Pre-formatted value, e.g. `"1.2K"` or `42`. */
  value: string | number;
}

export interface UserHoverCardProps {
  /**
   * Avatar image source — a URL string, or null/undefined to fall back to the
   * deterministic name-based placeholder rendered by {@link Avatar}.
   */
  avatar?: string | null;
  /** Canonical, already-resolved display name (an API contract — render directly). */
  displayName: string;
  /** Handle without the leading `@` (the component prefixes it). */
  username?: string;
  /** Optional short biography; truncated to a few lines. */
  bio?: string;
  /** Optional metrics row (e.g. Following / Followers). */
  stats?: UserHoverCardStat[];
  /** Whether to show the verified badge next to the display name. */
  verified?: boolean;
  /** Makes the identity area (avatar + name + handle) pressable. */
  onPressProfile?: () => void;
  /**
   * Slot for a consumer-injected action — typically the app's SDK FollowButton.
   * Bloom does NOT implement follow logic; it only renders the card.
   */
  action?: ReactNode;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
