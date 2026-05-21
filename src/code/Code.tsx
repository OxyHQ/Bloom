import React, { memo } from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
  Platform,
  type StyleProp,
  type TextStyle,
} from 'react-native';

import { useTheme } from '../theme/use-theme';

export interface CodeProps extends RNTextProps {
  style?: StyleProp<TextStyle>;
}

/**
 * Inline monospace text — render as `<code>` on web (CSS var family) and
 * `<Text fontFamily="Geist Mono">` on native.
 */
const CodeComponent = function Code({ children, style, ...rest }: CodeProps) {
  const { colors } = useTheme();

  if (Platform.OS === 'web') {
    return React.createElement(
      'code',
      {
        ...rest,
        style: {
          fontFamily: 'var(--bloom-font-mono)',
          fontSize: '0.92em',
          color: colors.text,
          ...(style as object | undefined),
        },
      },
      children,
    );
  }

  return (
    <RNText
      {...rest}
      style={[
        { fontFamily: 'Geist Mono', fontSize: 13, color: colors.text },
        style,
      ]}>
      {children}
    </RNText>
  );
};

export const Code = memo(CodeComponent);
Code.displayName = 'Code';
