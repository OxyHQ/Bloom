import React, { memo, useCallback, useMemo } from 'react';
import { Linking, Platform, View, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { parseRgba } from '../theme/color-utils';
import { oklchToSrgb, srgbToOklch, srgbToRgbString } from '../theme/color-space';
import {
  BUTTON_RADIUS,
  BUTTON_SHADOW,
  BUTTON_TRANSITION_MS,
  resolveButtonPalette,
  resolveButtonRamps,
} from '../button/shared';
import { Text } from '../typography';
import { useInteractionState } from '../hooks/use-interaction-state';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { StyledPressable } from '../styles/styled-primitives';
import type { WebCssStyle } from '../styles/web-view-style';
import { SOCIAL_COLOR_LOGOS } from './color-logos';
import { OxyMark } from './OxyMark';
import { useSvgIdPrefix } from './use-svg-id';
import { SOCIAL_PROVIDERS, type SocialColorLogo, type SocialProvider } from './providers';
import type {
  SocialBrand,
  SocialButtonAction,
  SocialButtonAppearance,
  SocialButtonProps,
  SocialButtonSize,
} from './types';

/**
 * The social sign-in button (`base/social-button`).
 *
 *              medium          small
 *   height     36              32         (Button medium / small)
 *   width      300             250        fixed so a column of providers lines up;
 *                                          `fullWidth` fills instead
 *   padding-x  12              10
 *   gap        8               8
 *   glyph      18              16         a touch under Button's 20 / 18 icons
 *   label      body-medium 14/20, truncates
 *   icon-only  36 × 36         32 × 32
 *
 * A full pill (like `Button`) rather than 10 / 8 px corners, so an icon-only
 * button is a circle.
 *
 *   colorful   180° gradient from the brand colour into a stop 0.04 darker and
 *              0.01 more chromatic in OKLCH (`oklch(from …)`), white
 *              glyph, shadow-xs. Hover brightness 1.06, active 0.95. Google is
 *              the PRIMARY button exactly — its gradients, hover and active.
 *   black      neutral-950, hover neutral-800, active neutral-900, white label.
 *   white      the secondary button (surface, 1px border, its hover / active),
 *              with the provider's real multi-colour mark. Apple, GitHub and X
 *              draw in near-black, so dark mode repaints their paths white.
 *   disabled   the whole button at 60% opacity.
 *
 *   oxy        the Oxy mark, two-tone: the mark in the glyph colour and its
 *              letters in the fill behind it (the accent on `colorful`,
 *              neutral-950 on `black`, white on `white`).
 *
 * No press scale on this control.
 */

const IS_WEB = Platform.OS === 'web';

export const SOCIAL_BUTTON_GEOMETRY = {
  medium: { height: 36, width: 300, paddingHorizontal: 12, glyph: 18 },
  small: { height: 32, width: 250, paddingHorizontal: 10, glyph: 16 },
} as const satisfies Record<
  SocialButtonSize,
  { height: number; width: number; paddingHorizontal: number; glyph: number }
>;

/** `gap-2`. */
const GAP = 8;

/** `disabled:opacity-60`. */
const DISABLED_OPACITY = 0.6;

/** `hover:brightness-[1.06] active:brightness-95`, for the derived brand fills. */
const HOVER_BRIGHTNESS = 1.06;
const ACTIVE_BRIGHTNESS = 0.95;

/**
 * Brands whose real mark is drawn in near-black. On a dark surface they vanish,
 * so dark mode repaints their paths white — the official treatment both publish
 * for dark backgrounds. Colourful marks (Google, Slack) stay exactly as drawn.
 */
const DARK_INVERTED_BRANDS: ReadonlySet<SocialBrand> = new Set<SocialBrand>(['apple', 'github', 'x']);

/**
 * Touch slack up to 44dp vertically, as `Button`; square buttons all round.
 * Native only — react-native-web drops `hitSlop`.
 */
const HIT_SLOP = {
  medium: { top: 4, bottom: 4, left: 0, right: 0 },
  small: { top: 6, bottom: 6, left: 0, right: 0 },
} as const;
const SQUARE_HIT_SLOP = {
  medium: { top: 4, bottom: 4, left: 4, right: 4 },
  small: { top: 6, bottom: 6, left: 6, right: 6 },
} as const;

type Gradient = readonly [top: string, bottom: string];

interface SocialStatePaint {
  background: string;
  gradient: Gradient | null;
  border: string;
}

export interface SocialButtonPaint {
  rest: SocialStatePaint;
  hover: SocialStatePaint;
  active: SocialStatePaint;
  disabled: SocialStatePaint;
  foreground: string;
  borderWidth: number;
  shadow: string;
  /** Keyboard focus ring (accent-500). */
  ring: string;
  /**
   * Colour of a monochrome glyph: the label colour on the filled appearances,
   * the brand colour on `white` (so a provider without a colour mark is not a
   * grey smudge).
   */
  glyph: string;
  /**
   * The derived brand fills change state by BRIGHTNESS rather than by a second
   * gradient. On web that is a real CSS filter; on native the
   * `hover` / `active` paints above carry the same multiplication pre-applied.
   */
  brightness: boolean;
}

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

const ACTION_PHRASE: Record<SocialButtonAction, string> = {
  continue: 'Continue with',
  signIn: 'Sign in with',
  signUp: 'Sign up with',
};

/** The default label and icon-only accessible name: `"Sign in with Oxy"`. */
export function socialButtonLabel(brandLabel: string, action: SocialButtonAction = 'continue'): string {
  return `${ACTION_PHRASE[action]} ${brandLabel}`;
}

/**
 * The `oklch(from <fill> calc(l - 0.04) calc(c + 0.01) h)` transform — down in
 * lightness and up slightly in chroma, which is what blue-500 → blue-600 does.
 * `null` for a colour this cannot parse (the caller then paints it flat).
 */
export function brandGradientBottom(color: string): string | null {
  const rgba = parseRgba(color);
  if (!rgba) return null;
  const { l, c, h } = srgbToOklch(rgba);
  // An achromatic colour's hue is powerless; CSS resolves it to 0.
  const hue = c < 1e-4 ? 0 : h;
  return srgbToRgbString(oklchToSrgb({ l: Math.max(0, l - 0.04), c: c + 0.01, h: hue }));
}

/** CSS `brightness(n)` applied to an opaque colour. */
function brighten(color: string, amount: number): string {
  const rgba = parseRgba(color);
  if (!rgba) return color;
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * amount)));
  return `rgb(${ch(rgba.r)} ${ch(rgba.g)} ${ch(rgba.b)})`;
}

function brandState(fill: string, amount: number): SocialStatePaint {
  const bottom = brandGradientBottom(fill);
  if (!bottom) return { background: fill, gradient: null, border: TRANSPARENT };
  const top = amount === 1 ? fill : brighten(fill, amount);
  return {
    background: top,
    gradient: [top, amount === 1 ? bottom : brighten(bottom, amount)],
    border: TRANSPARENT,
  };
}

/** The brand colour a built-in or custom brand paints with; `null` = theme accent. */
function brandFill(brand: SocialBrand, customColor: string | undefined): string | null {
  if (brand === 'custom') return customColor ?? '#000000';
  return SOCIAL_PROVIDERS[brand].brand;
}

/**
 * Every colour a social button paints, for one brand × appearance. Pure — takes
 * the theme, so it can be walked over presets without rendering.
 */
export function resolveSocialButtonPaint(
  brand: SocialBrand,
  appearance: SocialButtonAppearance,
  theme: Theme,
  customColor?: string,
): SocialButtonPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const shadow = BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'];
  const fill = brandFill(brand, customColor);

  if (appearance === 'white') {
    const p = resolveButtonPalette('secondary', theme);
    const state = (s: typeof p.rest): SocialStatePaint => ({
      background: s.background,
      gradient: null,
      border: s.border,
    });
    return {
      // The white appearance does not repaint on disabled — only dims.
      rest: state(p.rest),
      hover: state(p.hover),
      active: state(p.active),
      disabled: state(p.rest),
      foreground: theme.colors.text,
      borderWidth: 1,
      shadow,
      ring: accent[500],
      glyph: fill ?? accent[500],
      brightness: false,
    };
  }

  if (appearance === 'black') {
    const solid = (background: string): SocialStatePaint => ({
      background,
      gradient: null,
      border: TRANSPARENT,
    });
    return {
      rest: solid(n[950]),
      hover: solid(n[800]),
      active: solid(n[900]),
      disabled: solid(n[950]),
      foreground: '#FFFFFF',
      borderWidth: 0,
      shadow,
      ring: accent[500],
      glyph: '#FFFFFF',
      brightness: false,
    };
  }

  if (fill === null) {
    // Google: the primary button itself, gradient states included.
    const p = resolveButtonPalette('primary', theme);
    const state = (s: typeof p.rest): SocialStatePaint => ({
      background: s.background,
      gradient: s.gradient,
      border: TRANSPARENT,
    });
    return {
      rest: state(p.rest),
      hover: state(p.hover),
      active: state(p.active),
      disabled: state(p.disabled),
      foreground: p.rest.foreground,
      borderWidth: 0,
      shadow,
      ring: p.ring,
      glyph: p.rest.foreground,
      brightness: false,
    };
  }

  return {
    rest: brandState(fill, 1),
    hover: brandState(fill, HOVER_BRIGHTNESS),
    active: brandState(fill, ACTIVE_BRIGHTNESS),
    disabled: brandState(fill, 1),
    foreground: '#FFFFFF',
    borderWidth: 0,
    shadow,
    ring: accent[500],
    glyph: '#FFFFFF',
    brightness: true,
  };
}

// ---------------------------------------------------------------------------
//  Web stylesheet — focus ring, cursor, and the colour transitions.
//
//  The button is a react-native-web `Pressable`, so the rules hang off a
//  `dataSet` attribute (a class never reaches the DOM: react-native-css consumes
//  `className` into `style`). Hover and press are JS state painted inline, so the
//  sheet carries only what inline styles cannot: `:focus-visible`, the
//  transitions (kept out of inline style so reduced motion can switch them off)
//  and the disabled cursor. `adoptStyleSheet` no-ops without a `document`.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-social-button-web-css';
const ROOT = '[data-bloom-social-button]';
const HOVER_LAYER = '[data-bloom-social-button-hover]';
const T = `${BUTTON_TRANSITION_MS}ms`;

const SOCIAL_BUTTON_CSS = interactiveWebCss({
  selector: ROOT,
  varPrefix: 'bloom-social-button',
  // Puts the layout half of the shared `<button>` reset back to react-native-web's
  // own `View` model, and strips the anchor underline when `href` renders an `<a>`.
  base: `
    display: flex;
    box-sizing: border-box;
    text-decoration: none;
    isolation: isolate;
  `,
  transition: `background-color ${T} ease, border-color ${T} ease, box-shadow ${T} ease, color ${T} ease, filter ${T} ease`,
  hover: { declarations: '' },
  outlineOffset: 2,
  extraRules: `${ROOT}:disabled,
${ROOT}[aria-disabled="true"] {
  cursor: not-allowed;
}
${HOVER_LAYER} {
  transition: opacity ${T} ease;
}
@media (prefers-reduced-motion: reduce) {
${ROOT},
${HOVER_LAYER} {
  transition: none;
}
}`,
});

/** A top-to-bottom gradient: `background-image` on web, the native CSS-gradient style elsewhere. */
function gradientStyle([top, bottom]: Gradient): WebCssStyle {
  const image = `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`;
  return IS_WEB ? { backgroundImage: image } : { experimental_backgroundImage: image };
}

const LAYER: ViewStyle = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 };

/** A provider's real multi-colour mark. */
function ColorLogo({
  logo,
  size,
  inverted,
}: {
  logo: SocialColorLogo;
  size: number;
  inverted: boolean;
}) {
  // Gradient ids are per logo upstream; two buttons of one brand on a page must
  // not resolve each other's `url(#…)`, so every id is prefixed per instance.
  const prefix = useSvgIdPrefix('bloom-social');
  const resolveFill = (fill: string) =>
    fill.startsWith('url(#') ? `url(#${prefix}${fill.slice(5)}` : fill;

  return (
    <Svg width={size} height={size} viewBox={logo.viewBox} aria-hidden>
      {logo.gradients.length > 0 ? (
        <Defs>
          {logo.gradients.map((g) => (
            <LinearGradient key={g.id} id={`${prefix}${g.id}`} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}>
              {g.stops.map((s) => (
                <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
              ))}
            </LinearGradient>
          ))}
        </Defs>
      ) : null}
      {logo.nodes.map((node, index) =>
        'd' in node ? (
          <Path key={index} d={node.d} fill={inverted ? '#FFFFFF' : resolveFill(node.fill)} />
        ) : (
          <Circle
            key={index}
            cx={node.circle[0]}
            cy={node.circle[1]}
            r={node.circle[2]}
            fill={resolveFill(node.fill)}
          />
        ),
      )}
    </Svg>
  );
}

const SocialButtonComponent: React.FC<SocialButtonProps> = ({
  brand,
  config,
  size = 'medium',
  appearance = 'colorful',
  iconOnly = false,
  fullWidth = false,
  action = 'continue',
  children,
  onPress,
  href,
  disabled = false,
  style,
  textStyle,
  className,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const theme = useTheme();
  useInteractiveWebCss(STYLE_ID, SOCIAL_BUTTON_CSS);
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();

  const geometry = SOCIAL_BUTTON_GEOMETRY[size];
  const custom = brand === 'custom';
  const meta = custom ? undefined : SOCIAL_PROVIDERS[brand as SocialProvider];
  const label = custom ? (config?.label ?? 'SSO') : meta!.label;

  const paint = useMemo(
    () => resolveSocialButtonPaint(brand, appearance, theme, config?.color),
    [brand, appearance, theme, config?.color],
  );

  const isHovered = hovered && !pressed && !disabled;
  const isPressed = pressed && !disabled;
  // On web the derived brand fills keep their rest paint and take a filter.
  const webFilter = IS_WEB && paint.brightness;
  const state = disabled
    ? paint.disabled
    : isPressed && !webFilter
      ? paint.active
      : isHovered && !webFilter && !paint.rest.gradient
        ? paint.hover
        : paint.rest;
  // A gradient hover cross-fades in over the rest gradient (via a `::before`,
  // since `background-image` does not transition). The derived brand fills on
  // native have no hover pointer to speak of, but paint it the same way.
  const hoverGradient = !webFilter && paint.hover.gradient && !disabled ? paint.hover.gradient : null;

  const containerStyle = useMemo((): WebCssStyle => {
    const base: WebCssStyle = {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: GAP,
      height: geometry.height,
      width: fullWidth && !iconOnly ? '100%' : geometry.width,
      paddingLeft: geometry.paddingHorizontal,
      paddingRight: geometry.paddingHorizontal,
      borderRadius: BUTTON_RADIUS,
      overflow: 'hidden',
      borderWidth: paint.borderWidth,
      borderColor: state.border,
      backgroundColor: state.gradient ? TRANSPARENT : state.background,
      boxShadow: paint.shadow,
      opacity: disabled ? DISABLED_OPACITY : 1,
      '--bloom-social-button-ring': paint.ring,
    };
    if (iconOnly) {
      base.width = geometry.height;
      base.paddingLeft = 0;
      base.paddingRight = 0;
    }
    if (webFilter) {
      base.filter = isPressed
        ? `brightness(${ACTIVE_BRIGHTNESS})`
        : isHovered
          ? `brightness(${HOVER_BRIGHTNESS})`
          : 'brightness(1)';
    }
    return base;
  }, [geometry, fullWidth, iconOnly, paint, state, disabled, webFilter, isPressed, isHovered]);

  const labelStyle = useMemo(
    (): TextStyle => ({ color: paint.foreground, flexShrink: 1 }),
    [paint.foreground],
  );

  const colorLogo =
    appearance === 'white' && !custom ? SOCIAL_COLOR_LOGOS[brand as SocialProvider] : undefined;

  let glyph: React.ReactNode;
  if (custom) {
    glyph = config?.icon;
  } else if (brand === 'oxy') {
    glyph = (
      <OxyMark
        size={geometry.glyph}
        color={paint.glyph}
        letterColor={appearance === 'white' ? '#FFFFFF' : paint.rest.background}
      />
    );
  } else if (colorLogo) {
    glyph = (
      <ColorLogo
        logo={colorLogo}
        size={geometry.glyph}
        inverted={theme.isDark && DARK_INVERTED_BRANDS.has(brand)}
      />
    );
  } else {
    glyph = (
      <Svg width={geometry.glyph} height={geometry.glyph} viewBox={meta!.viewBox} aria-hidden>
        <Path d={meta!.path} fill={paint.glyph} />
      </Svg>
    );
  }

  const handlePress = useCallback(() => {
    if (disabled) return;
    onPress?.();
    // On web the rendered `<a href>` navigates by itself.
    if (href != null && !IS_WEB) {
      Linking.openURL(href).catch(() => {});
    }
  }, [disabled, onPress, href]);

  const isLink = href != null;
  // The visible label already names the brand; when it is hidden the control
  // needs that name back, or it announces as an unlabelled button.
  const phrase = socialButtonLabel(label, action);
  const name = accessibilityLabel ?? (iconOnly ? phrase : undefined);

  return (
    <StyledPressable
      // `dataSet` is react-native-web's one channel to a `data-*` attribute (the
      // sheet's hook); `href` makes react-native-web render a real `<a>`. Both
      // are web-only props react-native has no type for — see `chip/Chip.tsx`.
      {...(IS_WEB ? ({ dataSet: { bloomSocialButton: '' }, href: disabled ? undefined : href } as Record<string, unknown>) : {})}
      className={className}
      style={[containerStyle, style]}
      onPress={handlePress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      disabled={disabled}
      accessibilityRole={isLink ? 'link' : 'button'}
      accessibilityLabel={name}
      accessibilityHint={accessibilityHint}
      hitSlop={iconOnly ? SQUARE_HIT_SLOP[size] : HIT_SLOP[size]}
      testID={testID}
    >
      {state.gradient ? (
        <View pointerEvents="none" style={[LAYER, gradientStyle(state.gradient)]} />
      ) : null}
      {hoverGradient ? (
        <View
          pointerEvents="none"
          {...(IS_WEB ? ({ dataSet: { bloomSocialButtonHover: '' } } as Record<string, unknown>) : {})}
          style={[LAYER, gradientStyle(hoverGradient), { opacity: isHovered ? 1 : 0 }]}
        />
      ) : null}
      <View
        pointerEvents="none"
        style={{
          width: geometry.glyph,
          height: geometry.glyph,
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {glyph}
      </View>
      {iconOnly ? null : typeof children === 'string' || children == null ? (
        <Text variant="body-medium" numberOfLines={1} style={[labelStyle, textStyle]}>
          {children ?? phrase}
        </Text>
      ) : (
        children
      )}
    </StyledPressable>
  );
};

export const SocialButton = memo(SocialButtonComponent);
SocialButton.displayName = 'SocialButton';
