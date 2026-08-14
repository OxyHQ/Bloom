import React, { memo } from 'react';
import {
  type TextProps as RNTextProps,
  Platform,
  type TextStyle,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { fontFamilies } from '../fonts/tokens';
import { mergeTypographyStyle, typographyDefaultsWhenNoClassName } from './defaults';
import { getInteropText } from './styled-text';
import type { TextProps } from './types';

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
  if (kind === 'mono') return { fontFamily: 'Geist Mono' };
  // `display` and `sans` both resolve to BlomusModernus on native — Bloom's
  // default body font. The CSS stack in `tokens.ts` differs (display vs sans
  // have different fallback chains for web), but on RN the literal family
  // name is the only thing that matters; the .ttf is registered via
  // `useFonts(FONT_ASSETS)` in `FontLoader.native.tsx`.
  return { fontFamily: 'BlomusModernus' };
}

const SANS_FONT_FAMILY = fontFamilyStyle('sans');
const DISPLAY_FONT_FAMILY = fontFamilyStyle('display');

const DEFAULT_TEXT_TYPOGRAPHY: TextStyle = {
  fontSize: 13,
};

/**
 * Base text component with theme-aware default color and the Bloom sans
 * font family applied. NativeWind `className` utilities (text-*, font-*,
 * leading-*, text-foreground, …) override defaults when provided.
 */
const TextComponent = function Text({ children, style, className, ...rest }: TextProps) {
  const { colors } = useTheme();
  const InteropText = getInteropText();
  const trimmedClassName = className?.trim() ? className : undefined;

  return (
    <InteropText
      {...rest}
      {...(trimmedClassName ? { className: trimmedClassName } : {})}
      style={mergeTypographyStyle(
        trimmedClassName,
        { ...DEFAULT_TEXT_TYPOGRAPHY, color: colors.text },
        SANS_FONT_FAMILY,
        style,
      )}
    >
      {children}
    </InteropText>
  );
};

export const Text = memo(TextComponent);
Text.displayName = 'Text';

const HEADING_TYPOGRAPHY: TextStyle = {
  ...DISPLAY_FONT_FAMILY,
  fontWeight: '700',
};

function createHeadingElement({ level }: { level: number }): React.FC<TextProps> {
  return function HeadingElement({ style, className, ...rest }: TextProps) {
    const extraProps: Record<string, unknown> =
      Platform.OS === 'web'
        ? { role: 'heading', 'aria-level': level }
        : {};

    const headingBase = className?.trim()
      ? DISPLAY_FONT_FAMILY
      : HEADING_TYPOGRAPHY;

    return (
      <Text
        {...extraProps}
        {...rest}
        className={className}
        style={[headingBase, style]}
      />
    );
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

const DEFAULT_PARAGRAPH_TYPOGRAPHY: TextStyle = {
  fontSize: 15,
  lineHeight: 15 * 1.625,
};

export function P({ style, className, ...rest }: TextProps) {
  const extraProps: Record<string, unknown> =
    Platform.OS === 'web' ? { role: 'paragraph' } : {};
  const paragraphDefaults = typographyDefaultsWhenNoClassName(
    className,
    DEFAULT_PARAGRAPH_TYPOGRAPHY,
  );
  return (
    <Text
      {...extraProps}
      {...rest}
      className={className}
      style={[paragraphDefaults, style]}
    />
  );
}
P.displayName = 'P';

export { Text as Span };

export { fontFamilies };
