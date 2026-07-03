import React from 'react';
import {
  PixelRatio,
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Fill } from '../fill';
import { borderRadius } from '../styles/tokens';
import { useTheme } from '../theme';

/**
 * A 1px (hairline) inset border reads too heavy on high-DPI web displays, so we
 * drop to 0.5px there. On native the platform hairline is already correct, and
 * `PixelRatio` is only consulted on web.
 */
const HAIRLINE_WIDTH =
  Platform.OS === 'web' && PixelRatio.get() > 1 ? 0.5 : StyleSheet.hairlineWidth;

export interface MediaInsetBorderProps {
  /**
   * Render a solid, full-contrast border instead of the default softened one.
   * Use where the inset border must line up with adjacent opaque borders, such
   * as external link-preview cards.
   */
  opaque?: boolean;
  /**
   * Extra style merged last. Override `borderRadius` here to match the corner
   * radius of the surrounding media box.
   */
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * A theme-aware hairline border painted just inside a media box (image, avatar,
 * embed) to separate it from the surrounding background. Absolutely positioned
 * to fill its parent (built on {@link Fill}) and non-interactive.
 */
export function MediaInsetBorder({ opaque, style, children }: MediaInsetBorderProps) {
  const theme = useTheme();

  return (
    <Fill
      style={[
        styles.base,
        { borderColor: theme.colors.border },
        !opaque && styles.soft,
        style,
      ]}
    >
      {children}
    </Fill>
  );
}

MediaInsetBorder.displayName = 'MediaInsetBorder';

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.sm,
    borderWidth: HAIRLINE_WIDTH,
    pointerEvents: 'none',
  },
  // Non-opaque: same border color at reduced opacity so it reads as a subtle,
  // lower-contrast separator rather than a hard edge.
  soft: {
    opacity: 0.6,
  },
});
