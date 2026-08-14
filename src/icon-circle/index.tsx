import React, { memo } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { borderRadius } from '../styles/tokens';
import { type Props as IconProps } from '../icons/common';

const IconCircleComponent = function IconCircle({
  icon: Icon,
  size = 'xl',
  style,
  iconStyle,
}: {
  icon: React.ComponentType<IconProps>;
  size?: IconProps['size'];
  style?: ViewStyle | ViewStyle[];
  iconStyle?: IconProps['style'];
}) {
  const { colors } = useTheme();

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
      ]}>
      <Icon size={size} style={[{ color: colors.primary }, iconStyle]} />
    </View>
  );
};

export const IconCircle = memo(IconCircleComponent);
IconCircle.displayName = 'IconCircle';
