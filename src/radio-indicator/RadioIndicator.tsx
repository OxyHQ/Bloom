import React, { memo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { pressedSurface } from '../theme/press-colors';
import type { RadioIndicatorProps } from './types';

const RadioIndicatorComponent: React.FC<RadioIndicatorProps> = ({
  selected,
  pressed = false,
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
  const restBackground = selected ? resolvedSelectedColor : 'transparent';
  // Unselected there is no fill, so the press IS the fill and it takes the
  // neutral wash inside the ring — with no dot, so it still cannot be read as
  // chosen. Selected the circle keeps its colour and gains a state layer of the
  // dot's own. See `theme/press-colors.ts`.
  const background = pressed
    ? pressedSurface(theme.colors, restBackground, dotColor)
    : restBackground;

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
          backgroundColor: background,
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
