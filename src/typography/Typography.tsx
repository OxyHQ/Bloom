import type React from 'react';
import { memo } from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
  Platform,
  type StyleProp,
  StyleSheet,
  type TextStyle,
  View,
} from 'react-native';
import { useWindowWidthClass } from '../hooks/use-width-class';

import { useThemePaint } from '../theme/use-theme-paint';
import { DISPLAY_FACE_FAMILIES, withDisplayFaceCut } from '../fonts/display-face';
import { fontFamilies } from '../fonts/tokens';
import { BREAKPOINTS } from '../styles/breakpoints';
import { space } from '../styles/tokens';
import { TYPE_SCALE } from './scale';
import { DESKTOP_TYPE_SCALE, desktopTracking } from './desktop-scale';
import { useTypographyScope } from './TypographyScope';
import { DescriptionSource } from './DescriptionSource';
import { IS_WEB } from '../styles/platform';
import type { BlockquoteProps, TextProps } from './types';

/**
 * Platform-aware font-family value. On web we resolve to the CSS custom
 * property set by `applyFontFaces` so consumer apps can re-skin Bloom by
 * overriding `--bloom-font-*` at any subtree. On native we use the literal
 * family name registered by `expo-font`'s `useFonts(FONT_ASSETS)`.
 *
 * Exported so a text drawn in a family by name (the Bloom language's
 * `.font('mono')`) sets exactly the family `font-mono` gives Bloom's `Text`.
 */
export function fontFamilyStyle(kind: 'display' | 'sans' | 'mono'): { fontFamily: string } {
  if (Platform.OS === 'web') {
    return { fontFamily: `var(--bloom-font-${kind})` };
  }
  if (kind === 'mono') return { fontFamily: 'JetBrains Mono' };
  // On RN the literal family name is the only thing that matters; the .ttf is
  // registered via `useFonts(FONT_ASSETS)` in `FontLoader.native.tsx`. `sans`
  // is Inter (the UI face); `display` keeps BlomusModernus, named here by its
  // Regular cut: the text host swaps in the Bold cut once the weight is known.
  if (kind === 'display') return { fontFamily: DISPLAY_FACE_FAMILIES.regular };
  return { fontFamily: 'Inter' };
}

const SANS_FONT_FAMILY = fontFamilyStyle('sans');
const DISPLAY_FONT_FAMILY = fontFamilyStyle('display');

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
 * The family a `Text` is set in: BlomusModernus for the big titles, Inter for
 * the rest. A caller's `fontFamily` (the mono face, `fontFamilyStyle('mono')`)
 * comes after it and wins.
 */
function textFamily(variant: string | undefined, desktop: boolean = false) {
  const display =
    variant !== undefined &&
    isDisplayVariant(variant) &&
    // A desktop's chrome takes no display face for its titles (`desktop-scale.ts`);
    // the hero steps (`large-title`, `display-*`) keep it.
    !(desktop && /^title-[123]-/.test(variant));
  return display ? DISPLAY_FONT_FAMILY : SANS_FONT_FAMILY;
}

/**
 * NATIVE: the text draws the display face in the cut its final weight selects
 * (`fonts/display-face.ts`): a variant's, a heading's or the caller's.
 */
const textStyle: (style: StyleProp<TextStyle>) => StyleProp<TextStyle> =
  Platform.OS === 'web' ? (style) => style : withDisplayFaceCut;

const DEFAULT_TEXT_TYPOGRAPHY: TextStyle = {
  fontSize: 13,
};

/** The same 13px, with the desktop body's tracking (`desktop-scale.ts`). */
const DESKTOP_DEFAULT_TEXT_TYPOGRAPHY: TextStyle = {
  fontSize: 13,
  letterSpacing: desktopTracking(13),
};

/**
 * Base text component with theme-aware default color and the Bloom sans
 * font family applied (the display family for the `large-title` and `display-*`
 * variants). A caller's `style` overrides the defaults.
 */
const TextComponent = function Text({ children, style, variant, ...rest }: TextProps) {
  const colors = useThemePaint();
  const { systemFamily, desktop } = useTypographyScope();

  const merged: StyleProp<TextStyle> = [
    {
      ...(variant
        ? (desktop ? DESKTOP_TYPE_SCALE : TYPE_SCALE)[variant]
        : desktop
          ? DESKTOP_DEFAULT_TEXT_TYPOGRAPHY
          : DEFAULT_TEXT_TYPOGRAPHY),
      color: colors.text,
    },
    (rest.accessibilityRole === 'header' || rest.role === 'heading') && !desktop
      ? DISPLAY_FONT_FAMILY
      : textFamily(variant, desktop),
    [style, systemFamily],
  ];

  const host = (
    <RNText {...rest} style={textStyle(merged)}>
      {children}
    </RNText>
  );
  // On native a text with an id is findable by it, as a DOM element is: a control
  // whose `aria-describedby` names the id says this text as its hint.
  if (IS_WEB || typeof rest.nativeID !== 'string' || rest.nativeID.length === 0) return host;
  return (
    <>
      {host}
      <DescriptionSource id={rest.nativeID}>{children}</DescriptionSource>
    </>
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
  return function HeadingElement({ style, ...rest }: TextProps) {
    const colors = useThemePaint();
    const extraProps: Record<string, unknown> =
      Platform.OS === 'web' ? { role: 'heading', 'aria-level': level } : {};

    const headingBase = {
      ...DISPLAY_FONT_FAMILY,
      ...HEADING_SCALE[level],
      ...(level === 1 ? H1_ALIGNMENT : null),
      ...(level === 2 ? { ...H2_RULE, borderBottomColor: colors.border } : null),
    };

    return <Text {...extraProps} {...rest} style={[headingBase, style]} />;
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

export function P({ style, ...rest }: TextProps) {
  const width = useWindowWidthClass(SM_WIDTH);
  const extraProps: Record<string, unknown> = Platform.OS === 'web' ? { role: 'paragraph' } : {};
  const paragraphDefaults = {
    ...DEFAULT_PARAGRAPH_TYPOGRAPHY,
    marginTop: width >= BREAKPOINTS.sm ? space._2xl : space.md,
  };
  return <Text {...extraProps} {...rest} style={[paragraphDefaults, style]} />;
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
//  Each applies its defaults under the caller's `style`, which wins.
// ---------------------------------------------------------------------------

/** `text-muted-foreground text-xl` — 20/28. */
const LEAD_TYPOGRAPHY: TextStyle = {
  fontSize: 20,
  lineHeight: 28,
};

/** An intro paragraph — larger than body text and set in the secondary colour. */
export function Lead({ style, ...rest }: TextProps) {
  const colors = useThemePaint();
  const defaults = {
    ...LEAD_TYPOGRAPHY,
    color: colors.textSecondary,
  };
  return <Text {...rest} style={[defaults, style]} />;
}
Lead.displayName = 'Lead';

/** `text-lg font-semibold` — 18/28. */
const LARGE_TYPOGRAPHY: TextStyle = {
  fontSize: 18,
  lineHeight: 28,
  fontWeight: '600',
};

/** Emphasised body text — a form section's opening line, a callout's first row. */
export function Large({ style, ...rest }: TextProps) {
  return <Text {...rest} style={[LARGE_TYPOGRAPHY, style]} />;
}
Large.displayName = 'Large';

/** `text-sm font-medium leading-none` — 14, and `leading-none` is exactly 1×. */
const SMALL_TYPOGRAPHY: TextStyle = {
  fontSize: 14,
  lineHeight: 14,
  fontWeight: '500',
};

/** A dense label — form hints, table headers, metadata rows. */
export function Small({ style, ...rest }: TextProps) {
  return <Text {...rest} style={[SMALL_TYPOGRAPHY, style]} />;
}
Small.displayName = 'Small';

/** `text-muted-foreground text-sm` — 14/20. */
const MUTED_TYPOGRAPHY: TextStyle = {
  fontSize: 14,
  lineHeight: 20,
};

/** De-emphasised supporting text. */
export function Muted({ style, ...rest }: TextProps) {
  const colors = useThemePaint();
  const defaults = {
    ...MUTED_TYPOGRAPHY,
    color: colors.textSecondary,
  };
  return <Text {...rest} style={[defaults, style]} />;
}
Muted.displayName = 'Muted';

/**
 * A quotation, with the rule down its left edge.
 *
 * The one variant that is NOT a bare `Text`. React Native ignores border
 * styles on `Text` (Android renders a TextView, iOS an NSAttributedString —
 * neither draws a left rule), so the rule has to be a `View`: `style` addresses
 * the container, `textStyle` the quotation.
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
