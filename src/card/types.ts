import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

import type { RADIUS } from '../design-tokens/scales';
import type { ShadowRole } from '../design-tokens/shadows';

/**
 * The preset combination of background + border + elevation.
 *
 * Each variant is only a NAMED DEFAULT for the three independent axes below —
 * `plain` is the base surface and the other three add one axis each — so a
 * surface that needs an unusual combination refines it with `border` /
 * `elevation` instead of asking for a new variant.
 */
export type CardVariant = 'plain' | 'elevated' | 'outlined' | 'filled';

/**
 * A rung of the `RADIUS` scale. Deliberately not a number: a card, a settings
 * group and a link preview are legitimately different surfaces, and the scale is
 * what keeps "different" to seven values rather than seven hundred.
 */
export type CardRadius = keyof typeof RADIUS;

/** Elevation role, or none. Resolved through `bloomShadowStyle`, which owns the platform split. */
export type CardElevation = 'none' | ShadowRole;

/** Border width role. `thin` is the 1px default; `hairline` is the 0.5px `BORDER_WIDTH.hairline`. */
export type CardBorder = 'none' | 'hairline' | 'thin';

export interface CardProps {
  children?: React.ReactNode;
  /** Preset background + border + elevation. Default `elevated`. */
  variant?: CardVariant;
  /** Corner rung. Default `radius-12`. */
  radius?: CardRadius;
  /** Overrides the variant's elevation. */
  elevation?: CardElevation;
  /** Overrides the variant's border width. */
  border?: CardBorder;
  style?: StyleProp<ViewStyle>;
  className?: string;
  onPress?: () => void;
  /**
   * Role for the pressable form. A card that opens a URL is a `link`; a card
   * that performs an in-app action is a `button` (the default).
   */
  accessibilityRole?: 'button' | 'link';
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export interface CardHeaderProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export interface CardBodyProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export interface CardFooterProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export interface CardTitleProps {
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export interface CardDescriptionProps {
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}
