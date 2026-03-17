import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme } from '../theme/use-theme';
import type { DividerProps } from './types';

const DividerComponent: React.FC<DividerProps> = ({
  color,
  thickness = StyleSheet.hairlineWidth,
  vertical = false,
  spacing = 0,
  style,
  testID,
}) => {
  const theme = useTheme();
  const resolvedColor = color ?? theme.colors.border;

  return (
    <View
      testID={testID}
      style={[
        vertical
          ? {
              width: thickness,
              alignSelf: 'stretch',
              backgroundColor: resolvedColor,
              marginHorizontal: spacing,
            }
          : {
              height: thickness,
              width: '100%',
              backgroundColor: resolvedColor,
              marginVertical: spacing,
            },
        style,
      ]}
    />
  );
};

export const Divider = memo(DividerComponent);
Divider.displayName = 'Divider';
