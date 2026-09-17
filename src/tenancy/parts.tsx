import React, { useEffect, useMemo, type ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { BUTTON_GEOMETRY, BUTTON_RADIUS, mixColor } from '../button/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  HOUSING_CARD_PADDING,
  HOUSING_CARD_RADIUS,
  HOUSING_STYLE_ID,
  HOUSING_WEB_CSS,
  resolveHousingPalette,
  type HousingPalette,
} from './shared';
import type { HousingIcon } from './types';

/**
 * Internal parts the housing cards are built from. Not published: each is a
 * detail of a card's design, not a primitive a consumer should compose.
 */

/** Adopts the housing focus sheet once. */
export function useHousingWebCss(): void {
  useEffect(() => {
    adoptStyleSheet(HOUSING_STYLE_ID, HOUSING_WEB_CSS);
  }, []);
}

export function useHousingPalette(): HousingPalette {
  const theme = useTheme();
  return useMemo(() => resolveHousingPalette(theme), [theme]);
}

/**
 * The card every housing block sits in: radius 20, 1px hairline, the
 * floating-panel surface and its dropdown shadow, padding 20.
 */
export function HousingCard({
  children,
  style,
  testID,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  padded?: boolean;
}) {
  const palette = useHousingPalette();
  return (
    <View
      testID={testID}
      style={[
        {
          borderRadius: HOUSING_CARD_RADIUS,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.surface,
          boxShadow: palette.shadow,
          ...(padded
            ? {
                paddingTop: HOUSING_CARD_PADDING,
                paddingBottom: HOUSING_CARD_PADDING,
                paddingLeft: HOUSING_CARD_PADDING,
                paddingRight: HOUSING_CARD_PADDING,
              }
            : null),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A square neutral tile holding an icon (a category, a file type). */
export function IconTile({
  icon: Icon,
  size = 40,
  iconSize = 20,
  radius = 12,
  testID,
}: {
  icon: HousingIcon;
  size?: number;
  iconSize?: number;
  radius?: number;
  testID?: string;
}) {
  const palette = useHousingPalette();
  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: palette.tile,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon width={iconSize} height={iconSize} fill={palette.text} />
    </View>
  );
}

/** A small caption over a value — the label half of a figure. */
export function FigureLabel({ children }: { children: string }) {
  const palette = useHousingPalette();
  return (
    <Text variant="caption-1-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
      {children}
    </Text>
  );
}

/**
 * A pill toggle at `Button`'s geometry: resting neutral-100 (dark neutral-700)
 * with the text colour, on the brand fill with its foreground. Hover and press
 * change colour only. A `role="button"` toggle carries BOTH `aria-pressed`
 * (web) and `accessibilityState.selected` (native — React Native has no
 * pressed state).
 */
export function HousingToggleButton({
  label,
  accessibilityLabel,
  pressed,
  onPress,
  icon: Icon,
  pressedIcon: PressedIcon,
  size = 'small',
  disabled = false,
  testID,
}: {
  label: string;
  accessibilityLabel?: string;
  pressed: boolean;
  onPress?: () => void;
  icon?: HousingIcon;
  pressedIcon?: HousingIcon;
  size?: 'small' | 'medium';
  disabled?: boolean;
  testID?: string;
}) {
  useHousingWebCss();
  const palette = useHousingPalette();
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: down, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const g = BUTTON_GEOMETRY[size];
  const active = (hovered || down) && !disabled;
  const background = pressed
    ? active
      ? mixColor(palette.toggleOn, palette.text, 0.12)
      : palette.toggleOn
    : active
      ? palette.toggleOffHover
      : palette.toggleOff;
  const foreground = pressed ? palette.toggleOnForeground : palette.text;
  const ShownIcon = pressed && PressedIcon ? PressedIcon : Icon;

  const style: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    height: g.height,
    paddingLeft: g.paddingHorizontal + 4,
    paddingRight: g.paddingHorizontal + 6,
    gap: 4,
    borderRadius: BUTTON_RADIUS,
    backgroundColor: background,
    opacity: disabled ? 0.5 : 1,
    '--bloom-housing-ring': palette.ring,
  };

  return (
    <Pressable
      {...webDataSet({ bloomHousingFocus: '' })}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      aria-pressed={pressed}
      accessibilityState={{ selected: pressed, disabled }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      testID={testID}
      style={style}
    >
      {ShownIcon ? <ShownIcon width={g.iconSize - 2} height={g.iconSize - 2} fill={foreground} /> : null}
      <Text variant={g.type} numberOfLines={1} style={{ color: foreground }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A 6px progress bar: neutral track, text-colour fill. */
export function ProgressTrack({
  value,
  accessibilityLabel,
  valueText,
  testID,
}: {
  /** 0..1. */
  value: number;
  accessibilityLabel: string;
  valueText?: string;
  testID?: string;
}) {
  const palette = useHousingPalette();
  const clamped = Math.min(1, Math.max(0, value));
  const percent = Math.round(clamped * 100);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={valueText}
      testID={testID}
      style={{ height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: palette.track }}
    >
      <View
        testID={testID ? `${testID}-fill` : undefined}
        style={{ width: `${percent}%`, height: '100%', borderRadius: 3, backgroundColor: palette.text }}
      />
    </View>
  );
}
