import type { CornerCurve } from '../shapes/corner-types';
import type { BloomAppearance, BloomTone } from '../appearance';
import type { StyleProp, ViewStyle, TextStyle, ViewProps } from 'react-native';

import type { RADIUS } from '../design-tokens/scales';
import type { ShadowRole } from '../design-tokens/shadows';

/**
 * The preset combination of background + border + elevation.
 *
 * Each appearance is only a NAMED DEFAULT for the three independent axes below —
 * `plain` is the base surface and the other three add one axis each — so a
 * surface that needs an unusual combination refines it with `border` /
 * `elevation` instead of asking for a new appearance.
 */

/**
 * A rung of the `RADIUS` scale, or `panel` to inherit BloomScope.panelRadius
 * and the shared circular panel curve. Other cards retain the fixed radius
 * scale, so their geometry does not change with the workspace setting.
 */
export type CardRadius = keyof typeof RADIUS | 'panel';

/** Elevation role, or none. Resolved through `bloomShadowStyle`, which owns the platform split. */
export type CardElevation = 'none' | ShadowRole;

/** Border width role. `thin` is the 1px default; `hairline` is the 0.5px `BORDER_WIDTH.hairline`. */
export type CardBorder = 'none' | 'hairline' | 'thin' | 'medium';

/** Explicit shape axes win over style; uniform borderRadius may supply the fallback. */
type CardStyle = Omit<
  ViewStyle,
  Extract<
    keyof ViewStyle,
    `border${string}Radius` | `border${string}Width` | 'borderCurve' | 'overflow'
  >
> &
  Pick<ViewStyle, 'borderRadius'>;

export interface CardProps {
  children?: React.ReactNode;
  /** Preset background + border + elevation. Default `solid` with small elevation. */
  appearance?: BloomAppearance;
  tone?: BloomTone;
  /** Corner rung, or panel to inherit BloomScope.panelRadius and the shared circular curve. Default radius-20. */
  radius?: CardRadius;
  /** Circular by default; smooth opts into platform-adaptive curves. radius-max remains circular. */
  cornerCurve?: CornerCurve;
  /** Clip children in an inner layer, preserving outer shadows and focus. */
  clipContent?: boolean;
  /** Child layout and padding when clipContent is enabled. */
  contentStyle?: StyleProp<CardStyle>;
  /** Overrides the appearance's elevation. */
  elevation?: CardElevation;
  /** Overrides the appearance's border width. */
  border?: CardBorder;
  style?: StyleProp<CardStyle>;
  className?: string;
  /** Layout of the actual card host, without an extra measuring wrapper. */
  onLayout?: ViewProps['onLayout'];
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
