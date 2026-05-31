import React, { memo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import type { RadioIndicatorProps } from './types';

const RadioIndicatorComponent: React.FC<RadioIndicatorProps> = ({
  selected,
  size = 20,
  selectedColor,
  borderColor,
  style,
  testID,
}) => {
  const theme = useTheme();
  const resolvedSelectedColor = selectedColor ?? theme.colors.primary;
  const resolvedBorderColor = borderColor ?? theme.colors.border;
  // The inner dot sits on `resolvedSelectedColor`. When that is the theme
  // primary, use the preset's readable foreground (white for blue, black for
  // yellow). A caller-supplied custom color falls back to white.
  const dotColor = selectedColor == null ? theme.colors.primaryForeground : '#FFFFFF';
  const dotSize = size * 0.5;

  return (
    <View
      testID={testID}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: selected ? 0 : 2,
          borderColor: selected ? undefined : resolvedBorderColor,
          backgroundColor: selected ? resolvedSelectedColor : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {selected && (
        <View
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
          }}
        />
      )}
    </View>
  );
};

export const RadioIndicator = memo(RadioIndicatorComponent);
RadioIndicator.displayName = 'RadioIndicator';
