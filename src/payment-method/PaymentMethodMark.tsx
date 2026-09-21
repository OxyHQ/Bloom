import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useSurfaceFill } from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  PAYMENT_METHOD_GEOMETRY,
  PAYMENT_METHOD_KIND_ICON,
  PAYMENT_METHOD_MARK_GAP,
  PAYMENT_METHOD_STATE_TONE,
} from './constants';
import { resolvePaymentMethodPaint } from './shared';
import type { PaymentMethodMarkProps } from './types';

/**
 * The brand mark — and Bloom's is deliberately NOT a brand.
 *
 * **This never draws a scheme's logo, and it ships no list of schemes.** What it
 * draws is a plate the shape of a card, a neutral glyph on it, and — when the
 * caller gives one — the scheme's NAME as text beside it. Bloom does not know
 * what schemes exist, is not licensed to reproduce their artwork, and a library
 * that shipped twelve logos would be a library that quietly took on the
 * trademark question for every app using it.
 *
 * An app that HAS the rights passes `image`: it is drawn inside the plate, at
 * the plate's geometry, and everything else stays the same. That is the whole
 * escape hatch, and it belongs to the app because the rights do.
 *
 *   plate    40 x 28, radius 6 (compact 32 x 22, radius 5), one surface step
 *            off whatever is behind it — wider than tall is what reads as a
 *            card rather than an app tile
 *   glyph    18 in the secondary text rung (compact 14)
 *   name     body-2-medium, 8 after the plate
 *   state    `expired`/`declined` paint the plate in the state's tint, so a
 *            row that cannot be used says so before its words are read
 */
function PaymentMethodMarkComponent({
  scheme,
  kind = 'card',
  icon,
  image,
  state = 'ok',
  density = 'comfortable',
  style,
  testID,
}: PaymentMethodMarkProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolvePaymentMethodPaint(theme, surface), [theme, surface]);
  const g = PAYMENT_METHOD_GEOMETRY[density];
  const Glyph = icon ?? PAYMENT_METHOD_KIND_ICON[kind];
  const tone = PAYMENT_METHOD_STATE_TONE[state];
  // `resolveAccentColors`, never an appended alpha: the tint and the glyph that
  // sits on it are a PAIR the colour policy generates together (`docs/badge.mdx`).
  const accent = tone ? resolveAccentColors(theme.colors, tone, 'subtle') : undefined;

  return (
    <View
      style={[{ flexDirection: 'row', alignItems: 'center', gap: PAYMENT_METHOD_MARK_GAP }, style]}
      testID={testID}
    >
      <View
        testID={testID ? `${testID}-plate` : undefined}
        style={{
          width: g.plateWidth,
          height: g.plateHeight,
          borderRadius: g.plateRadius,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: accent ? accent.background : paint.plate,
        }}
      >
        {/*
          `image` is read for PRESENCE. `image={null}` is an app saying "I have
          no artwork for this one and I do not want the glyph either"; a `??`
          would have answered it with the glyph.
        */}
        {image !== undefined ? (
          image
        ) : (
          <Glyph
            width={g.glyph}
            height={g.glyph}
            fill={accent ? accent.foreground : paint.textSecondary}
          />
        )}
      </View>
      {scheme ? (
        <Text
          variant="body-2-medium"
          numberOfLines={1}
          testID={testID ? `${testID}-scheme` : undefined}
          style={{ flexShrink: 1, minWidth: 0, color: paint.text }}
        >
          {scheme}
        </Text>
      ) : null}
    </View>
  );
}

export const PaymentMethodMark = memo(PaymentMethodMarkComponent);
PaymentMethodMark.displayName = 'PaymentMethodMark';
