import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { useAccessibleNameWarning } from '../hooks/use-accessible-name-warning';
import type { DotGridMeterProps } from './types';

/**
 * A data-driven grid of small circular dots — the "diversity meter" visual. The
 * first `filled` dots use `filledColor`, the rest use `emptyColor`, laid out in
 * a flex-wrapped grid of `columns` per row. Pure `<View>` composition (no SVG),
 * so it renders identically on web and native.
 */
const DotGridMeterComponent: React.FC<DotGridMeterProps> = ({
  filled,
  total,
  columns = 10,
  dotSize = 10,
  gap = 6,
  filledColor,
  emptyColor,
  accessibilityLabel,
  style,
  testID,
}) => {
  const { colors } = useTheme();
  useAccessibleNameWarning('DotGridMeter', accessibilityLabel);
  const onColor = filledColor ?? colors.success;
  const offColor = emptyColor ?? colors.backgroundSecondary;

  const safeTotal = Math.max(0, Math.floor(total));
  const safeFilled = Math.min(safeTotal, Math.max(0, Math.floor(filled)));
  // A row can hold at most `columns` dots; a grid narrower than one full row
  // should still wrap tightly, so the container width follows the smaller count.
  const perRow = Math.max(1, Math.floor(columns));
  const rowWidth = Math.min(safeTotal, perRow);

  const dots = useMemo(
    () => Array.from({ length: safeTotal }, (_, index) => index < safeFilled),
    [safeTotal, safeFilled],
  );

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap,
          width: rowWidth * dotSize + Math.max(0, rowWidth - 1) * gap,
        },
        style,
      ]}
      accessibilityRole="progressbar"
      // The FLAT `aria-value*` props: react-native-web drops the
      // `accessibilityValue` object entirely, so the meter announced a
      // progressbar carrying no value. React Native folds these back into
      // `accessibilityValue`, so native is unchanged.
      aria-valuemin={0}
      aria-valuemax={safeTotal}
      aria-valuenow={safeFilled}
      // The NAME, which the value props above do not supply: `progressbar`
      // takes its name from the author alone, so an unnamed one announces a
      // number against nothing.
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {dots.map((isFilled, index) => (
        <View
          key={index}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: isFilled ? onColor : offColor,
          }}
        />
      ))}
    </View>
  );
};

export const DotGridMeter = memo(DotGridMeterComponent);
DotGridMeter.displayName = 'DotGridMeter';
