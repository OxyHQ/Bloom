import React, { memo, useCallback, useId, useMemo, type ComponentType } from 'react';
import { Linking, Platform, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '../theme/use-theme';
import { resolveButtonPalette } from '../button/shared';
import type { ButtonProps } from '../button/types';
import { SOCIAL_COLOR_LOGOS } from './color-logos';
import { OxyMark } from './OxyMark';
import { SOCIAL_PROVIDERS, type SocialColorLogo, type SocialProvider } from './providers';
import type { SocialBrand, SocialButtonAction, SocialButtonProps } from './types';

export const SOCIAL_BUTTON_GEOMETRY = {
  medium: { height: 36, width: 300, paddingHorizontal: 12, glyph: 18 },
  small: { height: 32, width: 250, paddingHorizontal: 10, glyph: 16 },
} as const;
const DARK_INVERTED_BRANDS = new Set<SocialBrand>(['apple', 'github', 'x']);
const ACTION_PHRASE: Record<SocialButtonAction, string> = {
  continue: 'Continue with', signIn: 'Sign in with', signUp: 'Sign up with',
};
export function socialButtonLabel(brandLabel: string, action: SocialButtonAction = 'continue'): string {
  return `${ACTION_PHRASE[action]} ${brandLabel}`;
}

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
  const prefix = `bloom-social-${useId().replace(/[^a-zA-Z0-9]/g, '')}-`;
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

export function createSocialButton(Button: ComponentType<ButtonProps>) {
const SocialButton = memo(function SocialButton({
  brand, config, size = 'medium', appearance = 'colorful', iconOnly = false,
  fullWidth = false, action = 'continue', children, onPress, href, disabled = false,
  style, textStyle, className, accessibilityLabel, accessibilityHint, testID,
}: SocialButtonProps) {
  const theme = useTheme();
  const geometry = SOCIAL_BUTTON_GEOMETRY[size];
  const custom = brand === 'custom';
  const meta = custom ? undefined : SOCIAL_PROVIDERS[brand as SocialProvider];
  const label = custom ? (config?.label ?? 'SSO') : meta!.label;
  const fill = custom ? (config?.color ?? '#000000') : meta!.brand;
  const variant = appearance === 'white' ? 'secondary' : 'primary';
  const colors = useMemo(() => appearance === 'white' || (appearance === 'colorful' && fill === null)
    ? undefined
    : { background: appearance === 'black' ? '#0a0a0a' : fill!, foreground: '#FFFFFF' },
    [appearance, fill]);
  const palette = useMemo(() => resolveButtonPalette(variant, theme, 'primary', colors), [variant, theme, colors]);
  const paint = {
    glyph: appearance === 'white' ? (fill ?? theme.colors.primary) : palette.rest.foreground,
    rest: { background: colors?.background ?? theme.colors.primary },
  };
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
    // Social navigation keeps its existing contract: notify, then open the URL.
    if (href != null && Platform.OS !== 'web') void Linking.openURL(href).catch(() => {});
  }, [disabled, onPress, href]);
  const phrase = socialButtonLabel(label, action);
  return (
    <Button
      variant={variant}
      colors={colors}
      size={size}
      iconOnly={iconOnly}
      icon={<View pointerEvents="none" style={{ width: geometry.glyph, height: geometry.glyph, flexShrink: 0 }}>{glyph}</View>}
      disabled={disabled}
      onPress={handlePress}
      href={href}
      className={className}
      accessibilityLabel={accessibilityLabel ?? (iconOnly ? phrase : undefined)}
      accessibilityHint={accessibilityHint}
      testID={testID}
      style={[{ width: iconOnly ? geometry.height : fullWidth ? '100%' : geometry.width,
        paddingLeft: iconOnly ? 0 : geometry.paddingHorizontal,
        paddingRight: iconOnly ? 0 : geometry.paddingHorizontal, gap: 8 }, style]}
      textStyle={textStyle}
    >
      {iconOnly ? undefined : children ?? phrase}
    </Button>
  );
});
return SocialButton;
}
