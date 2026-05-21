import React, { memo } from 'react';
import {
  Text as RNText,
  View,
  type TextProps as RNTextProps,
  Platform,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';

import { useTheme } from '../theme/use-theme';

export interface PreProps extends Omit<RNTextProps, 'style'> {
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<TextStyle>;
}

/**
 * Block-level monospace text — render as `<pre>` on web (CSS var family)
 * and `<View><Text fontFamily="Geist Mono"></View>` on native.
 */
const PreComponent = function Pre({
  children,
  containerStyle,
  style,
  ...rest
}: PreProps) {
  const { colors } = useTheme();

  if (Platform.OS === 'web') {
    return React.createElement(
      'pre',
      {
        ...rest,
        style: {
          fontFamily: 'var(--bloom-font-mono)',
          fontSize: '0.92em',
          color: colors.text,
          backgroundColor: colors.backgroundSecondary,
          padding: '12px 16px',
          borderRadius: 8,
          overflow: 'auto',
          margin: 0,
          ...(containerStyle as object | undefined),
          ...(style as object | undefined),
        },
      },
      children,
    );
  }

  return (
    <View
      style={[
        {
          backgroundColor: colors.backgroundSecondary,
          padding: 12,
          borderRadius: 8,
        },
        containerStyle,
      ]}>
      <RNText
        {...rest}
        style={[
          { fontFamily: 'Geist Mono', fontSize: 13, color: colors.text },
          style,
        ]}>
        {children}
      </RNText>
    </View>
  );
};

export const Pre = memo(PreComponent);
Pre.displayName = 'Pre';
