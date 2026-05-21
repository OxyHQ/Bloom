import React, { memo } from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
  Platform,
  type StyleProp,
  type TextStyle,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { fontFamilies } from '../fonts/tokens';

export type TextProps = RNTextProps;

/**
 * Platform-aware font-family value. On web we resolve to the CSS custom
 * property set by `applyFontFaces` so consumer apps can re-skin Bloom by
 * overriding `--bloom-font-*` at any subtree. On native we use the literal
 * family name registered by `expo-font`'s `useFonts(FONT_ASSETS)`.
 */
function fontFamilyStyle(
  kind: 'display' | 'sans' | 'mono',
): { fontFamily: string } {
  if (Platform.OS === 'web') {
    return { fontFamily: `var(--bloom-font-${kind})` };
  }
  if (kind === 'display') return { fontFamily: 'BlomusModernus' };
  if (kind === 'mono') return { fontFamily: 'Geist Mono' };
  return { fontFamily: 'Inter' };
}

const SANS_FONT_FAMILY = fontFamilyStyle('sans');
const DISPLAY_FONT_FAMILY = fontFamilyStyle('display');

/**
 * Base text component with theme-aware default color and the Bloom sans
 * font family applied.
 */
const TextComponent = function Text({ children, style, ...rest }: TextProps) {
  const { colors } = useTheme();

  return (
    <RNText
      {...rest}
      style={[{ fontSize: 13, color: colors.text, ...SANS_FONT_FAMILY }, style]}>
      {children}
    </RNText>
  );
};

export const Text = memo(TextComponent);
Text.displayName = 'Text';

export { Text as Span };

const HEADING_STYLE: StyleProp<TextStyle> = {
  ...DISPLAY_FONT_FAMILY,
  fontWeight: '700',
};

function createHeadingElement({ level }: { level: number }): React.FC<TextProps> {
  return function HeadingElement({ style, ...rest }: TextProps) {
    const extraProps: Record<string, unknown> =
      Platform.OS === 'web'
        ? { role: 'heading', 'aria-level': level }
        : {};
    return <Text {...extraProps} {...rest} style={[HEADING_STYLE, style]} />;
  };
}

export const H1 = createHeadingElement({ level: 1 });
H1.displayName = 'H1';
export const H2 = createHeadingElement({ level: 2 });
H2.displayName = 'H2';
export const H3 = createHeadingElement({ level: 3 });
H3.displayName = 'H3';
export const H4 = createHeadingElement({ level: 4 });
H4.displayName = 'H4';
export const H5 = createHeadingElement({ level: 5 });
H5.displayName = 'H5';
export const H6 = createHeadingElement({ level: 6 });
H6.displayName = 'H6';

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
P.displayName = 'P';

export { fontFamilies };
