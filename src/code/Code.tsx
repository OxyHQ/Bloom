import { memo } from 'react';
import { type Role, Text as RNText } from 'react-native';

import { IS_WEB } from '../styles/platform';
import { MONO_FAMILY, useCodePalette } from './shared';
import type { CodeProps } from './types';

/**
 * 0.92em: a touch smaller than the sentence around it. React Native types
 * `fontSize` as a number; react-native-web passes any CSS length through.
 */
const WEB_INLINE_FONT_SIZE = '0.92em' as unknown as number;
const NATIVE_INLINE_FONT_SIZE = 13;
/**
 * react-native-web renders `role="code"` as a `<code>` element; React Native's
 * `Role` union leaves the ARIA `code` role out.
 */
const WEB_CODE_ROLE = 'code' as Role;

/**
 * Inline monospace text — a real `<code>` on web and a `Text` in JetBrains Mono
 * on native, in the text colour, a touch smaller than the sentence around it
 * (0.92em on web, 13 on native).
 *
 * Both platforms render React Native's `Text`: on web `role="code"` makes
 * react-native-web emit the `<code>` element, so every `TextProps` a caller
 * passes (`testID`, `accessibilityLabel`, `numberOfLines`, a style array or a
 * compiled `className`) is translated to the DOM rather than spread onto it raw.
 */
const CodeComponent = function Code({ children, style, ...rest }: CodeProps) {
  const palette = useCodePalette();

  return (
    <RNText
      {...rest}
      role={IS_WEB ? WEB_CODE_ROLE : rest.role}
      style={[
        {
          fontFamily: MONO_FAMILY,
          fontSize: IS_WEB ? WEB_INLINE_FONT_SIZE : NATIVE_INLINE_FONT_SIZE,
          color: palette.inline,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
};

export const Code = memo(CodeComponent);
Code.displayName = 'Code';

export type { CodeProps } from './types';
