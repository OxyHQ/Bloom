import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { borderRadius } from '../styles/tokens';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ENERGY_CLASSES, resolveEnergyTones, resolveInsightPalette } from './shared';
import type { EnergyBadgeProps } from './types';

/**
 * The energy class inline — on a listing card, in a facts row.
 *
 *            small                 medium
 *   height   20                    24
 *   disc     16, caption-2-bold    20, caption-1-bold
 *   label    caption-1-medium      body-2-medium
 *
 * A pill on neutral-100 (dark neutral-800): a disc in the class colour with
 * the letter (white or neutral-950, whichever contrasts more), 2 inset, then
 * `label` ("Energy") 6 after it and 8 from the end. Pending: a neutral disc
 * with a clock and `pendingLabel`. One image named "Energy rating C".
 */

const GEOMETRY = {
  small: { height: 20, disc: 16, letter: 'caption-2-bold', label: 'caption-1-medium', icon: 10 },
  medium: { height: 24, disc: 20, letter: 'caption-1-bold', label: 'body-2-medium', icon: 12 },
} as const;

function EnergyBadgeComponent({
  rating,
  pending: pendingProp = false,
  label = 'Energy',
  pendingLabel = 'Pending',
  size = 'medium',
  accessibilityLabel,
  style,
  testID,
}: EnergyBadgeProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveInsightPalette(theme), [theme]);
  const tones = useMemo(() => resolveEnergyTones(theme), [theme]);
  const g = GEOMETRY[size];
  const pending = pendingProp || !rating;
  const tone = rating ? tones[ENERGY_CLASSES.indexOf(rating)] : undefined;
  const text = pending ? pendingLabel : label;
  const inset = (g.height - g.disc) / 2;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? (pending ? `Energy rating ${pendingLabel.toLowerCase()}` : `Energy rating ${rating}`)}
      testID={testID}
      style={[
        {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          height: g.height,
          gap: 6,
          paddingLeft: inset,
          paddingRight: text ? 8 : inset,
          borderRadius: borderRadius.full,
          backgroundColor: palette.track,
        },
        style,
      ]}
    >
      <View
        testID={testID ? `${testID}-disc` : undefined}
        style={{
          width: g.disc,
          height: g.disc,
          borderRadius: g.disc / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pending || !tone ? palette.bar : tone.fill,
        }}
      >
        {pending || !tone ? (
          <RiTimeLine width={g.icon} height={g.icon} fill={palette.text} />
        ) : (
          <Text variant={g.letter} style={{ color: tone.foreground }}>
            {rating}
          </Text>
        )}
      </View>
      {text ? (
        <Text variant={g.label} numberOfLines={1} style={{ color: palette.text }}>
          {text}
        </Text>
      ) : null}
    </View>
  );
}

export const EnergyBadge = memo(EnergyBadgeComponent);
EnergyBadge.displayName = 'EnergyBadge';
