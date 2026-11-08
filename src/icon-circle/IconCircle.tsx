import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { borderRadius } from '../styles/tokens';
import { sizes } from '../icons/shared';
import type { IconCircleProps } from './types';

const IconCircleComponent = function IconCircle({
  icon: Icon,
  size = 'xl',
  style,
  iconStyle,
}: IconCircleProps) {
  const { colors } = useTheme();
  const color = StyleSheet.flatten(iconStyle)?.color ?? colors.primary;
  // Canonical slots receive numeric geometry and a string fill. Keep the
  // existing style passthrough for richer glyphs (including native ColorValue
  // objects, which those glyphs resolve from style rather than a string fill).
  const iconProps = {
    width: sizes[size],
    height: sizes[size],
    fill: typeof color === 'string' ? color : undefined,
    style: [{ color: colors.primary }, iconStyle],
  };

  return (
    <View
      style={[
        {
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: borderRadius.full,
          width: size === 'lg' ? 52 : 64,
          height: size === 'lg' ? 52 : 64,
          backgroundColor: colors.primarySubtle,
        },
        style,
      ]}
    >
      <Icon {...iconProps} />
    </View>
  );
};

export const IconCircle = memo(IconCircleComponent);
IconCircle.displayName = 'IconCircle';
