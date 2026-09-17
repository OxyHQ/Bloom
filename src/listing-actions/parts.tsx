import React, { useEffect, useMemo, type ReactNode } from 'react';
import { Image, Platform, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { isImageUrl, resolveBookingPalette, BOOKING_FIELD_RADIUS, BOOKING_STYLE_ID, BOOKING_WEB_CSS } from '../booking/shared';
import { mixColor, resolveButtonRamps } from '../button/shared';
import { chartHueTone } from '../chart-cards/palette';
import { pieSectorAngles, sectorPath } from '../chart-cards/polar-geometry';
import { webDataSet } from '../checkbox/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiHome4Line } from '../icons/remix/RiHome4Line';
import { RiInformationLine } from '../icons/remix/RiInformationLine';
import { useImageResolver } from '../image-resolver/context';
import { borderRadius } from '../styles/tokens';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { ExchangeHome, KeyFact } from './types';

const IS_WEB = Platform.OS === 'web';

/**
 * INTERNAL — the pieces the `listing-actions` cards share.
 *
 *   FactList         label / value rows in a radius-12 box (neutral-300 / 600
 *                    border, 1px dividers), padding 10 × 12; label
 *                    body-2-regular text-secondary, value body-2-medium
 *   StatusMessage    an information line on a neutral-100 / 700 tile, radius 12
 *   SelectChip       a `radio`: outlined at rest, a neutral wash on hover, and
 *                    INVERTED (text-primary fill, surface text) when selected
 *   HomeTile         a home's photo, title, location and size
 *   PrincipalDonut   two sectors on the chart-card geometry and hues
 */

export function useFocusSheet() {
  useEffect(() => {
    adoptStyleSheet(BOOKING_STYLE_ID, BOOKING_WEB_CSS);
  }, []);
}

export function useActionPalette() {
  const theme = useTheme();
  return useMemo(() => ({ theme, ...resolveBookingPalette(theme) }), [theme]);
}

// ---------------------------------------------------------------------------

export function FactList({
  facts,
  style,
  testID,
}: {
  facts: readonly KeyFact[];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const palette = useActionPalette();
  if (facts.length === 0) return null;
  return (
    <View
      testID={testID}
      style={[
        { borderWidth: 1, borderColor: palette.fieldBorder, borderRadius: BOOKING_FIELD_RADIUS },
        style,
      ]}
    >
      {facts.map((fact, index) => (
        <View
          key={fact.key ?? fact.label}
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: 12,
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 12,
            paddingRight: 12,
            borderTopWidth: index === 0 ? 0 : 1,
            borderTopColor: palette.fieldBorder,
          }}
        >
          <Text variant="body-2-regular" numberOfLines={1} style={{ flex: 1, minWidth: 0, color: palette.textSecondary }}>
            {fact.label}
          </Text>
          <Text variant="body-2-medium" style={{ color: palette.text, textAlign: 'right', flexShrink: 1 }}>
            {fact.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------

export function StatusMessage({
  children,
  style,
  testID,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const palette = useActionPalette();
  const { neutral } = useMemo(() => resolveButtonRamps(palette.theme), [palette.theme]);
  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 12,
          paddingRight: 12,
          borderRadius: BOOKING_FIELD_RADIUS,
          backgroundColor: palette.theme.isDark ? neutral[700] : neutral[100],
        },
        style,
      ]}
    >
      <View style={{ paddingTop: 1 }}>
        <RiInformationLine width={18} height={18} fill={palette.textSecondary} />
      </View>
      <Text variant="body-2-regular" style={{ flex: 1, minWidth: 0, color: palette.text }}>
        {children}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------

export interface SelectChipProps {
  selected: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel: string;
  /** `day` is a radius-12 tile of two lines; `slot` a pill. */
  shape: 'day' | 'slot';
  /** Rendered with the ink colour for the current state. */
  children: (ink: string) => ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SelectChip({
  selected,
  disabled = false,
  onPress,
  accessibilityLabel,
  shape,
  children,
  style,
  testID,
}: SelectChipProps) {
  const palette = useActionPalette();
  useFocusSheet();
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();

  const background = selected
    ? palette.text
    : !disabled && (hovered || pressed)
      ? palette.highlight
      : 'transparent';

  const chipStyle: WebCssStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: selected ? palette.text : palette.fieldBorder,
    backgroundColor: background,
    opacity: disabled ? 0.4 : 1,
    ...(shape === 'day'
      ? { width: 56, paddingTop: 8, paddingBottom: 8, borderRadius: BOOKING_FIELD_RADIUS, gap: 2 }
      : { height: 36, paddingLeft: 12, paddingRight: 12, borderRadius: borderRadius.full }),
    '--bloom-booking-ring': palette.ring,
  };

  return (
    <Pressable
      {...webDataSet({ bloomBookingFocus: '' })}
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: selected, disabled }}
      aria-checked={selected}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      testID={testID}
      style={[chipStyle, style]}
    >
      {children(selected ? palette.surface : palette.text)}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------

export function HomeTile({
  home,
  label,
  orientation,
  testID,
  style,
}: {
  home: ExchangeHome;
  label: string;
  orientation: 'vertical' | 'horizontal';
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = useActionPalette();
  const resolver = useImageResolver();
  const uri = home.image
    ? isImageUrl(home.image)
      ? home.image
      : resolver?.(home.image, home.imageVariant)
    : undefined;
  const horizontal = orientation === 'horizontal';
  const name = [label, home.title, home.location, home.details].filter(Boolean).join(', ');

  const photo = (
    <View
      style={[
        { borderRadius: BOOKING_FIELD_RADIUS, overflow: 'hidden', backgroundColor: palette.tile },
        horizontal ? { width: 72, height: 72 } : { width: '100%', aspectRatio: 4 / 3 },
      ]}
    >
      {uri ? null : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <RiHome4Line width={horizontal ? 24 : 28} height={horizontal ? 24 : 28} fill={palette.textSecondary} />
        </View>
      )}
      {uri ? (
        <Image
          source={{ uri }}
          accessibilityIgnoresInvertColors
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : null}
    </View>
  );

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={name}
      {...(IS_WEB ? { role: 'group' as const } : null)}
      style={[horizontal ? { flexDirection: 'row', alignItems: 'center', gap: 12 } : { gap: 8 }, style]}
    >
      {horizontal ? null : (
        <Text variant="caption-2-bold" numberOfLines={1} style={{ color: palette.textSecondary, textTransform: 'uppercase' }}>
          {label}
        </Text>
      )}
      {photo}
      <View style={{ flex: horizontal ? 1 : undefined, minWidth: 0, gap: 2 }}>
        {horizontal ? (
          <Text variant="caption-2-bold" numberOfLines={1} style={{ color: palette.textSecondary, textTransform: 'uppercase' }}>
            {label}
          </Text>
        ) : null}
        <Text variant="body-2-medium" numberOfLines={2} style={{ color: palette.text }}>
          {home.title}
        </Text>
        {home.location ? (
          <Text variant="caption-1-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
            {home.location}
          </Text>
        ) : null}
        {home.details ? (
          <Text variant="caption-1-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
            {home.details}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------

/** The donut's two hues: principal chart-6 (blue), interest chart-2 (lime). */
export function resolveDonutTones(theme: Theme): { principal: string; interest: string } {
  return { principal: chartHueTone(theme, 6).color, interest: chartHueTone(theme, 2).color };
}

export const DONUT_SIZE = 136;
export const DONUT_THICKNESS = 18;

export function PrincipalDonut({
  principal,
  interest,
  accessibilityLabel,
  size = DONUT_SIZE,
  children,
  testID,
}: {
  principal: number;
  interest: number;
  accessibilityLabel: string;
  size?: number;
  children?: ReactNode;
  testID?: string;
}) {
  const palette = useActionPalette();
  const tones = useMemo(() => resolveDonutTones(palette.theme), [palette.theme]);
  const { neutral } = useMemo(() => resolveButtonRamps(palette.theme), [palette.theme]);
  const track = palette.theme.isDark ? neutral[700] : mixColor(neutral[100], neutral[200], 0.5);
  const c = size / 2;
  const outer = c;
  const inner = c - DONUT_THICKNESS;
  const values = [Math.max(0, principal), Math.max(0, interest)];
  const angles = pieSectorAngles(values, 90, -270, values[0]! > 0 && values[1]! > 0 ? 2 : 0);
  const colors = [tones.principal, tones.interest];

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={accessibilityLabel}
      {...(IS_WEB ? { role: 'img' as const } : null)}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
        {angles.length === 0 ? (
          <Path
            d={sectorPath({ cx: c, cy: c, innerRadius: inner, outerRadius: outer, startAngle: 90, endAngle: -270 }) ?? ''}
            fill={track}
          />
        ) : (
          angles.map((a, i) => {
            const d = sectorPath({
              cx: c,
              cy: c,
              innerRadius: inner,
              outerRadius: outer,
              startAngle: a.startAngle,
              endAngle: a.endAngle,
              cornerRadius: 4,
            });
            return d ? <Path key={i} d={d} fill={colors[i]} testID={testID ? `${testID}-sector-${i}` : undefined} /> : null;
          })
        )}
      </Svg>
      {children}
    </View>
  );
}
