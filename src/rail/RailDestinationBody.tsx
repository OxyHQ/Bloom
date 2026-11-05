import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { StyledView } from '../styles/styled-primitives';
import { borderRadius } from '../styles/tokens';
import { RAIL_DESTINATION } from './geometry';

/** Shared indicator and label layout; each caller owns paint, icons and semantics. */
export function RailDestinationBody({
  animated,
  indicatorStyle,
  indicatorClassName,
  indicatorTestID,
  icon,
  label,
}: {
  animated?: boolean;
  indicatorStyle?: StyleProp<ViewStyle>;
  indicatorClassName?: string;
  indicatorTestID?: string;
  icon: ReactNode;
  label: ReactNode;
}) {
  const geometry: ViewStyle = {
    width: RAIL_DESTINATION.indicatorWidth,
    height: RAIL_DESTINATION.indicatorHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  };
  return (
    <>
      {animated ? (
        <Animated.View testID={indicatorTestID} style={[geometry, indicatorStyle]}>
          {icon}
        </Animated.View>
      ) : (
        <StyledView
          testID={indicatorTestID}
          className={indicatorClassName}
          style={[geometry, indicatorStyle]}
        >
          {icon}
        </StyledView>
      )}
      {label}
    </>
  );
}
