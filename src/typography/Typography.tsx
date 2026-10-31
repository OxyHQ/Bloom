import type React from 'react';
import { type ComponentRef, type ComponentType, memo, type ReactNode, type Ref } from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
  Platform,
  type StyleProp,
  StyleSheet,
  type TextStyle,
  View,
} from 'react-native';
import { styled } from 'react-native-css';
import { useWindowWidthClass } from '../hooks/use-width-class';

import { useThemePaint } from '../theme/use-theme-paint';
import { DISPLAY_FACE_FAMILIES, withDisplayFaceCut } from '../fonts/display-face';
import { fontFamilies } from '../fonts/tokens';
import { BREAKPOINTS } from '../styles/breakpoints';
import { space } from '../styles/tokens';
import { mergeTypographyStyle, typographyDefaultsWhenNoClassName } from './defaults';
import { TYPE_SCALE } from './scale';
import { StyledText } from '../styles/styled-primitives';
import { useTypographySystemFamily } from './TypographyScope';
import type { BlockquoteProps, TextProps } from './types';

/**
 * Platform-aware font-family value. On web we resolve to the CSS custom
 * property set by `applyFontFaces` so consumer apps can re-skin Bloom by
 * overriding `--bloom-font-*` at any subtree. On native we use the literal
 * family name registered by `expo-font`'s `useFonts(FONT_ASSETS)`.
 */
function fontFamilyStyle(kind: 'display' | 'sans' | 'mono'): { fontFamily: string } {
  if (Platform.OS === 'web') {
    return { fontFamily: `var(--bloom-font-${kind})` };
  }
  if (kind === 'mono') return { fontFamily: 'JetBrains Mono' };
  // On RN the literal family name is the only thing that matters; the .ttf is
  // registered via `useFonts(FONT_ASSETS)` in `FontLoader.native.tsx`. `sans`
  // is Inter (the UI face); `display` keeps BlomusModernus, named here by its
  // Regular cut: `TextHost` swaps in the Bold cut once the weight is known.
  if (kind === 'display') return { fontFamily: DISPLAY_FACE_FAMILIES.regular };
  return { fontFamily: 'Inter' };
}

const SANS_FONT_FAMILY = fontFamilyStyle('sans');
const DISPLAY_FONT_FAMILY = fontFamilyStyle('display');
const MONO_FONT_FAMILY = fontFamilyStyle('mono');

/**
 * The titles of the scale — `large-title` and `display-1` … `display-4`, 32px and up — are
 * set in BlomusModernus, Oxy's brand face, as `H1`–`H4` are; `title-*` also uses the display face; `headline`, `body` and `caption` remain Inter unless rendered as a semantic Title/Subtitle. The face is a property of the variant, so a screen
 * that asks for a big title gets the brand face without naming it.
 */
const isDisplayVariant = (variant: string): boolean =>
  variant.startsWith('large-title-') ||
  variant.startsWith('display-') ||
  /^title-[123]-/.test(variant);

/**
 * The same by className, for a title sized with utilities instead of a variant: an explicit
 * `font-display`, or a size from `text-3xl` (30px) up, at any breakpoint or state
 * (`md:text-5xl`, `dark:font-display`).
 */
const DISPLAY_CLASS =
  /(?:^|\s)(?:[\w-]+:)*(?:font-display|text-[3-9]xl|text-title-[123]-(?:regular|medium|semibold|bold))(?=\s|$)/;

/**
 * An explicit `font-mono`, at any breakpoint or state (`md:font-mono`). The
 * family is set inline, and an inline style beats a utility, so without this a
 * caller asking for mono by class got Inter. Bloom defines no serif family
 * (`fonts/tokens.ts`), so there is no `font-serif` counterpart.
 */
const MONO_CLASS = /(?:^|\s)(?:[\w-]+:)*font-mono(?=\s|$)/;

/**
 * The family a `Text` is set in: JetBrains Mono when the className asks for
 * `font-mono` (an explicit family beats one implied by size), BlomusModernus
 * for the big titles, Inter for the rest.
 */
function textFamily(variant: string | undefined, className: string | undefined) {
  if (className !== undefined && MONO_CLASS.test(className)) return MONO_FONT_FAMILY;
  const display =
    (variant !== undefined && isDisplayVariant(variant)) ||
    (className !== undefined && DISPLAY_CLASS.test(className));
  return display ? DISPLAY_FONT_FAMILY : SANS_FONT_FAMILY;
}

type TextHostProps = RNTextProps & { ref?: Ref<ComponentRef<typeof RNText>> };

/**
 * NATIVE ONLY: the text node, drawing the display face in the cut its weight
 * selects (`fonts/display-face.ts`).
 *
 * It sits UNDER `styled()`, so the style it reads is the one `react-native-css`
 * resolved from the className, followed by Bloom's inline defaults and the
 * caller's style: a variant's weight, a heading's, a `font-bold` utility at any
 * breakpoint or state, and an inline `fontWeight` all reach it. Text reading it
 * above `styled()` would see the className as a string and miss every utility.
 */
function DisplayFaceText({ style, ...rest }: TextHostProps) {
  return <RNText {...rest} style={withDisplayFaceCut(style)} />;
}

/**
 * The web keeps `StyledText`: one `BlomusModernus` family with a 400 and a 700
 * `@font-face`, matched by the browser.
 */
const TextHost: ComponentType<TextHostProps> =
  Platform.OS === 'web'
    ? StyledText
    : styled(DisplayFaceText as (props: { style?: StyleProp<TextStyle> }) => ReactNode, {
        className: 'style',
      });

const DEFAULT_TEXT_TYPOGRAPHY: TextStyle = {
  fontSize: 13,
};

/**
 * Base text component with theme-aware default color and the Bloom sans
 * font family applied (the display family for the `large-title` and `display-*`
 * variants). NativeWind `className` utilities (text-*, font-*,
 * leading-*, text-foreground, …) override defaults when provided.
 */
const TextComponent = function Text({ children, style, className, variant, ...rest }: TextProps) {
  const colors = useThemePaint();
  const systemFamily = useTypographySystemFamily();
  const trimmedClassName = className?.trim() ? className : undefined;

  return (
    <TextHost
      {...rest}
      {...(trimmedClassName ? { className: trimmedClassName } : {})}
      style={mergeTypographyStyle(
        trimmedClassName,
        { ...(variant ? TYPE_SCALE[variant] : DEFAULT_TEXT_TYPOGRAPHY), color: colors.text },
        rest.accessibilityRole === 'header' || rest.role === 'heading'
          ? DISPLAY_FONT_FAMILY
          : textFamily(variant, trimmedClassName),
        [style, systemFamily],
      )}
    >
      {children}
    </TextHost>
  );
};

export const Text = memo(TextComponent);
Text.displayName = 'Text';

/**
 * The heading ramp, in react-native-reusables' own numbers.
 *
 * Upstream's `h1`–`h4` are `text-4xl font-extrabold tracking-tight`,
 * `text-3xl font-semibold tracking-tight`, `text-2xl …` and `text-xl …` — a
 * ramp Bloom's headings did not have AT ALL: every level rendered at the base
 * `Text` size, so an `<H1>` and a `<Span>` were the same 13px apart from their
 * weight. `tracking-tight` is −0.025em, resolved against each level's own size.
 *
 * `h5`/`h6` have no upstream counterpart; they continue the ramp at `text-lg`
 * and `text-base` with `h4`'s weight.
 *
 * `font-extrabold` on `h1` and `font-semibold` below it are carried across.
 * The FAMILY is not: upstream sets everything in one sans face, where a Bloom
 * heading is set in the display family — the same layer as the colour roles,
 * and Bloom's own.
 */
const HEADING_SCALE: Record<number, TextStyle> = {
  1: { fontSize: 36, lineHeight: 40, fontWeight: '800', letterSpacing: 36 * -0.025 },
  2: { fontSize: 30, lineHeight: 36, fontWeight: '600', letterSpacing: 30 * -0.025 },
  3: { fontSize: 24, lineHeight: 32, fontWeight: '600', letterSpacing: 24 * -0.025 },
  4: { fontSize: 20, lineHeight: 28, fontWeight: '600', letterSpacing: 20 * -0.025 },
  5: { fontSize: 18, lineHeight: 28, fontWeight: '600', letterSpacing: 18 * -0.025 },
  6: { fontSize: 16, lineHeight: 24, fontWeight: '600', letterSpacing: 16 * -0.025 },
};

/** `text-center` — upstream centres `h1`, and only `h1`. */
const H1_ALIGNMENT: TextStyle = { textAlign: 'center' };

/** `border-border border-b pb-2` — upstream rules `h2` off from what follows. */
const H2_RULE: TextStyle = { borderBottomWidth: 1, paddingBottom: 8 };

function createHeadingElement({ level }: { level: number }): React.FC<TextProps> {
  return function HeadingElement({ style, className, ...rest }: TextProps) {
    const colors = useThemePaint();
    const extraProps: Record<string, unknown> =
      Platform.OS === 'web' ? { role: 'heading', 'aria-level': level } : {};

    // Only the FAMILY survives a caller's `className`: react-native-css merges
    // utilities into `style` first, so keeping `fontSize`/`fontWeight` here
    // would silently beat a caller's `text-2xl`.
    const headingBase = className?.trim()
      ? DISPLAY_FONT_FAMILY
      : {
          ...DISPLAY_FONT_FAMILY,
          ...HEADING_SCALE[level],
          ...(level === 1 ? H1_ALIGNMENT : null),
          ...(level === 2 ? { ...H2_RULE, borderBottomColor: colors.border } : null),
        };

    return <Text {...extraProps} {...rest} className={className} style={[headingBase, style]} />;
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

/** The window's width decides a paragraph's and a quotation's spacing at `sm` only. */
const SM_WIDTH = [BREAKPOINTS.sm];

/** `mt-3 leading-7 sm:mt-6`, over the base `text-base`. */
const DEFAULT_PARAGRAPH_TYPOGRAPHY: TextStyle = {
  fontSize: 16,
  lineHeight: 28,
};

export function P({ style, className, ...rest }: TextProps) {
  const width = useWindowWidthClass(SM_WIDTH);
  const extraProps: Record<string, unknown> = Platform.OS === 'web' ? { role: 'paragraph' } : {};
  const paragraphDefaults = typographyDefaultsWhenNoClassName(className, {
    ...DEFAULT_PARAGRAPH_TYPOGRAPHY,
    marginTop: width >= BREAKPOINTS.sm ? space._2xl : space.md,
  });
  return (
    <Text {...extraProps} {...rest} className={className} style={[paragraphDefaults, style]} />
  );
}
P.displayName = 'P';

/** Semantic heading with Bloom's display family at any standard type-scale size. */
export function Title({ style, variant = 'title-1-semibold', ...rest }: TextProps) {
  return (
    <Text
      accessibilityRole="header"
      {...rest}
      variant={variant}
      style={[DISPLAY_FONT_FAMILY, style]}
    />
  );
}

/** Secondary title text; its role is distinct from ordinary body and control copy. */
export function Subtitle({ style, variant = 'body-regular', ...rest }: TextProps) {
  return <Text {...rest} variant={variant} style={[DISPLAY_FONT_FAMILY, style]} />;
}

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

/** `text-muted-foreground text-xl` — 20/28. */
const LEAD_TYPOGRAPHY: TextStyle = {
  fontSize: 20,
  lineHeight: 28,
};

/** An intro paragraph — larger than body text and set in the secondary colour. */
export function Lead({ style, className, ...rest }: TextProps) {
  const colors = useThemePaint();
  const defaults = typographyDefaultsWhenNoClassName(className, {
    ...LEAD_TYPOGRAPHY,
    color: colors.textSecondary,
  });
  return <Text {...rest} className={className} style={[defaults, style]} />;
}
Lead.displayName = 'Lead';

/** `text-lg font-semibold` — 18/28. */
const LARGE_TYPOGRAPHY: TextStyle = {
  fontSize: 18,
  lineHeight: 28,
  fontWeight: '600',
};

/** Emphasised body text — a form section's opening line, a callout's first row. */
export function Large({ style, className, ...rest }: TextProps) {
  const defaults = typographyDefaultsWhenNoClassName(className, LARGE_TYPOGRAPHY);
  return <Text {...rest} className={className} style={[defaults, style]} />;
}
Large.displayName = 'Large';

/** `text-sm font-medium leading-none` — 14, and `leading-none` is exactly 1×. */
const SMALL_TYPOGRAPHY: TextStyle = {
  fontSize: 14,
  lineHeight: 14,
  fontWeight: '500',
};

/** A dense label — form hints, table headers, metadata rows. */
export function Small({ style, className, ...rest }: TextProps) {
  const defaults = typographyDefaultsWhenNoClassName(className, SMALL_TYPOGRAPHY);
  return <Text {...rest} className={className} style={[defaults, style]} />;
}
Small.displayName = 'Small';

/** `text-muted-foreground text-sm` — 14/20. */
const MUTED_TYPOGRAPHY: TextStyle = {
  fontSize: 14,
  lineHeight: 20,
};

/** De-emphasised supporting text. */
export function Muted({ style, className, ...rest }: TextProps) {
  const colors = useThemePaint();
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
  const colors = useThemePaint();
  const width = useWindowWidthClass(SM_WIDTH);
  const wide = width >= BREAKPOINTS.sm;
  const extraProps: Record<string, unknown> = Platform.OS === 'web' ? { role: 'blockquote' } : {};

  return (
    <View
      {...extraProps}
      testID={testID}
      style={[
        styles.blockquote,
        // `mt-4 sm:mt-6` and `pl-3 sm:pl-6` — a leading margin only, never a
        // trailing one, so a quotation sits against the paragraph it follows.
        { marginTop: wide ? space._2xl : space.lg, paddingLeft: wide ? space._2xl : space.md },
        { borderLeftColor: colors.border },
        style,
      ]}
    >
      <Text style={[styles.blockquoteText, { color: colors.textSecondary }, textStyle]}>
        {children}
      </Text>
    </View>
  );
}
Blockquote.displayName = 'Blockquote';

const styles = StyleSheet.create({
  // `border-l-2 italic` (the insets are applied at the call site, where the
  // breakpoint is read).
  blockquote: {
    borderLeftWidth: 2,
  },
  blockquoteText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
});

export { fontFamilies };
