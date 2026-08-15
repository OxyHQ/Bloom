import React, { memo } from 'react';
import {
  type TextProps as RNTextProps,
  Platform,
  StyleSheet,
  type TextStyle,
  View,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { fontFamilies } from '../fonts/tokens';
import { fontSize, lineHeight, space } from '../styles/tokens';
import { mergeTypographyStyle, typographyDefaultsWhenNoClassName } from './defaults';
import { StyledText } from '../styles/styled-primitives';
import type { BlockquoteProps, TextProps } from './types';

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
  const trimmedClassName = className?.trim() ? className : undefined;

  return (
    <StyledText
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
    </StyledText>
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

// ---------------------------------------------------------------------------
//  Semantic prose variants
//
//  shadcn/react-native-reusables express these as `variant` on ONE `Text`
//  (`lead`, `large`, `small`, `muted`, `blockquote`). Bloom's typography is flat
//  components (`H1`, `P`, `Span`) and stays that way: a flat component is what
//  `H1`–`H6` already are, and a `variant` prop beside them would be two ways to
//  ask for a heading. RNR's `code` variant is deliberately NOT ported — Bloom's
//  `code/` family already owns that, and a second spelling is the ambiguity
//  Bloom removes rather than adds.
//
//  Every one of these applies its defaults through
//  `typographyDefaultsWhenNoClassName`, for the reason that helper exists:
//  react-native-css merges utilities into `style` FIRST, so an inline default
//  repeating `fontSize`/`color` would silently beat the caller's `text-lg` or
//  `text-primary`.
// ---------------------------------------------------------------------------

const LEAD_TYPOGRAPHY: TextStyle = {
  fontSize: fontSize.xl,
  lineHeight: fontSize.xl * lineHeight.normal,
};

/** An intro paragraph — larger than body text and set in the secondary colour. */
export function Lead({ style, className, ...rest }: TextProps) {
  const { colors } = useTheme();
  const defaults = typographyDefaultsWhenNoClassName(className, {
    ...LEAD_TYPOGRAPHY,
    color: colors.textSecondary,
  });
  return <Text {...rest} className={className} style={[defaults, style]} />;
}
Lead.displayName = 'Lead';

const LARGE_TYPOGRAPHY: TextStyle = {
  fontSize: fontSize.lg,
  lineHeight: fontSize.lg * lineHeight.snug,
  fontWeight: '600',
};

/** Emphasised body text — a form section's opening line, a callout's first row. */
export function Large({ style, className, ...rest }: TextProps) {
  const defaults = typographyDefaultsWhenNoClassName(className, LARGE_TYPOGRAPHY);
  return <Text {...rest} className={className} style={[defaults, style]} />;
}
Large.displayName = 'Large';

const SMALL_TYPOGRAPHY: TextStyle = {
  fontSize: fontSize.sm,
  // RNR's `leading-none`: a label sits on its own baseline with no extra
  // leading, which is what lets it pack tightly against the control it names.
  lineHeight: fontSize.sm,
  fontWeight: '500',
};

/** A dense label — form hints, table headers, metadata rows. */
export function Small({ style, className, ...rest }: TextProps) {
  const defaults = typographyDefaultsWhenNoClassName(className, SMALL_TYPOGRAPHY);
  return <Text {...rest} className={className} style={[defaults, style]} />;
}
Small.displayName = 'Small';

const MUTED_TYPOGRAPHY: TextStyle = {
  fontSize: fontSize.sm,
  lineHeight: fontSize.sm * lineHeight.normal,
};

/** De-emphasised supporting text. */
export function Muted({ style, className, ...rest }: TextProps) {
  const { colors } = useTheme();
  const defaults = typographyDefaultsWhenNoClassName(className, {
    ...MUTED_TYPOGRAPHY,
    color: colors.textSecondary,
  });
  return <Text {...rest} className={className} style={[defaults, style]} />;
}
Muted.displayName = 'Muted';

/**
 * A quotation, with the rule down its left edge.
 *
 * The one variant that is NOT a bare `Text`, and the one that takes no
 * `className`. React Native ignores border styles on `Text` (Android renders a
 * TextView, iOS an NSAttributedString — neither draws a left rule), so the rule
 * has to be a `View`. That makes the node the parent lays out a `View` while the
 * utilities a caller would write (`text-lg`, `text-primary`) belong on the
 * `Text` inside it — the exact split that makes `className` land on the wrong
 * node and fail silently. So it is not offered: `style` addresses the container,
 * `textStyle` the quotation, and a caller who wants utilities composes a `View`
 * and a `Text` directly.
 */
export function Blockquote({ children, style, textStyle, testID }: BlockquoteProps) {
  const { colors } = useTheme();
  const extraProps: Record<string, unknown> =
    Platform.OS === 'web' ? { role: 'blockquote' } : {};

  return (
    <View
      {...extraProps}
      testID={testID}
      style={[styles.blockquote, { borderLeftColor: colors.border }, style]}>
      <Text style={[styles.blockquoteText, { color: colors.textSecondary }, textStyle]}>
        {children}
      </Text>
    </View>
  );
}
Blockquote.displayName = 'Blockquote';

const styles = StyleSheet.create({
  blockquote: {
    borderLeftWidth: 2,
    paddingLeft: space.md,
    marginVertical: space.sm,
  },
  blockquoteText: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.relaxed,
    fontStyle: 'italic',
  },
});

export { fontFamilies };
