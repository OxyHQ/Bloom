import React, { memo } from 'react';
import { Platform, Text as RNText } from 'react-native';

import { MONO_FAMILY, useCodePalette } from './shared';
import type { CodeProps } from './types';

/**
 * Inline monospace text — a real `<code>` on web and a `Text` in JetBrains Mono
 * on native, in the text colour, a touch smaller than the sentence around it
 * (0.92em on web, 13 on native).
 */
const CodeComponent = function Code({ children, style, ...rest }: CodeProps) {
  const palette = useCodePalette();

  if (Platform.OS === 'web') {
    return React.createElement(
      'code',
      {
        ...rest,
        style: {
          fontFamily: MONO_FAMILY,
          fontSize: '0.92em',
          color: palette.inline,
          ...(style as object | undefined),
        },
      },
      children,
    );
  }

  return (
    <RNText {...rest} style={[{ fontFamily: MONO_FAMILY, fontSize: 13, color: palette.inline }, style]}>
      {children}
    </RNText>
  );
};

export const Code = memo(CodeComponent);
Code.displayName = 'Code';

export type { CodeProps } from './types';
