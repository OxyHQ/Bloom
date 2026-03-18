import React from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
  Platform,
  type StyleProp,
  type TextStyle,
} from 'react-native';

import { useTheme } from '../theme/use-theme';

export type TextProps = RNTextProps;

/**
 * Base text component with theme-aware default color.
 */
export function Text({ children, style, ...rest }: TextProps) {
  const { colors } = useTheme();

  return (
    <RNText
      {...rest}
      style={[{ fontSize: 13, color: colors.text }, style]}>
      {children}
    </RNText>
  );
}

export { Text as Span };

function createHeadingElement({ level }: { level: number }) {
  return function HeadingElement({ style, ...rest }: TextProps) {
    const extraProps: Record<string, unknown> =
      Platform.OS === 'web'
        ? { role: 'heading', 'aria-level': level }
        : {};
    return <Text {...extraProps} {...rest} style={style} />;
  };
}

export const H1 = createHeadingElement({ level: 1 });
export const H2 = createHeadingElement({ level: 2 });
export const H3 = createHeadingElement({ level: 3 });
export const H4 = createHeadingElement({ level: 4 });
export const H5 = createHeadingElement({ level: 5 });
export const H6 = createHeadingElement({ level: 6 });

export function P({ style, ...rest }: TextProps) {
  const extraProps: Record<string, unknown> =
    Platform.OS === 'web' ? { role: 'paragraph' } : {};
  return (
    <Text
      {...extraProps}
      {...rest}
      style={[{ fontSize: 15, lineHeight: 15 * 1.625 }, style]}
    />
  );
}
