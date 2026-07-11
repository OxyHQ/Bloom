import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { AvatarRingConfig } from '../avatar/types';
import type { AvatarGroupItem } from '../avatar-group/types';

export type ProfileCardLayout = 'widget' | 'wide';
export type ProfileCardVariant = 'wallet' | 'social' | 'shopping' | 'stat';

/** The avatar block of a {@link ProfileCard}. All values are consumer-supplied. */
export interface ProfileCardAvatar {
  /**
   * Avatar value, routed into {@link Avatar}'s `source` prop — a full URL or a
   * resolver-handled id (e.g. an Oxy file ID).
   */
  source?: string | null;
  /** Decorative ring. Defaults to a solid ring in the variant accent color. */
  ring?: AvatarRingConfig;
  /** Badge overlay pinned to the avatar's bottom-right (e.g. a small logo). */
  badge?: ReactNode;
  /** Name used for the avatar's initial/placeholder and accessibility. */
  name?: string;
}

/** The metric visual rendered below the headline. */
export type ProfileCardMetric =
  | { kind: 'dots'; label?: string; filled: number; total: number; filledColor?: string }
  | {
      kind: 'progress';
      label: string;
      value: number;
      max: number;
      minLabel?: string;
      maxLabel?: string;
      icon?: ReactNode;
      fillColor?: string;
    }
  | {
      kind: 'split';
      label: string;
      percent: number;
      leftValue: string;
      rightValue: string;
      fillColor?: string;
    }
  | { kind: 'custom'; node: ReactNode };

/** The trailing facepile row (e.g. "Top tokens"). */
export interface ProfileCardFooter {
  /** Small label above the row. */
  label?: string;
  /** Avatars rendered adjacent in a row. */
  items: AvatarGroupItem[];
  /** Maximum avatars before collapsing into `+N`. @default 4 */
  max?: number;
}

export interface ProfileCardProps {
  /**
   * Card shape. `'widget'` is a compact ~square card; `'wide'` is a full-width
   * card. @default 'widget'
   */
  layout?: ProfileCardLayout;
  /**
   * Selects sensible accent defaults (ring / metric fill). Every accent stays
   * overridable per-element. @default 'stat'
   */
  variant?: ProfileCardVariant;
  /** Avatar block. */
  avatar: ProfileCardAvatar;
  /** Pre-formatted headline value (e.g. a balance or count). */
  value: string;
  /** Secondary line under the headline. */
  subtitle?: string;
  /** Node floated at the card's top-right (e.g. a trophy or menu icon). */
  headlineIcon?: ReactNode;
  /** Metric visual below the headline. */
  metric?: ProfileCardMetric;
  /** Trailing facepile row. */
  footer?: ProfileCardFooter;
  /** Press handler — makes the whole card pressable. */
  onPress?: () => void;
  /** Container style override (merged over the card surface). */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
