import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  type ViewStyle,
  type TextStyle,
  type DimensionValue,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { borderRadius } from '../styles/tokens';
import { SUPPORTS_NATIVE_DRIVER } from '../styles/native-driver';

const SHIMMER_DURATION = 1500;
const SHIMMER_MIN_OPACITY = 0.4;
const SHIMMER_MAX_OPACITY = 1;

function useShimmer() {
  const opacity = useRef(new Animated.Value(SHIMMER_MAX_OPACITY)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: SHIMMER_MIN_OPACITY,
          duration: SHIMMER_DURATION / 2,
          useNativeDriver: SUPPORTS_NATIVE_DRIVER,
        }),
        Animated.timing(opacity, {
          toValue: SHIMMER_MAX_OPACITY,
          duration: SHIMMER_DURATION / 2,
          useNativeDriver: SUPPORTS_NATIVE_DRIVER,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return opacity;
}

export function Text({
  blend,
  style,
}: {
  style?: TextStyle | TextStyle[];
  blend?: boolean;
}) {
  const { colors } = useTheme();
  const shimmer = useShimmer();
  const flattened = StyleSheet.flatten(style);
  const width = (flattened as ViewStyle)?.width;
  const lineHeight = (flattened?.lineHeight as number) || 14;

  return (
    <View
      style={[
        styles.textOuter,
        { maxWidth: width as number },
        { paddingVertical: lineHeight * 0.15 },
      ]}>
      <Animated.View
        style={[
          styles.textInner,
          {
            backgroundColor: colors.contrast50,
            height: lineHeight * 0.7,
            opacity: Animated.multiply(shimmer, blend ? 0.6 : 1),
          },
        ]}
      />
    </View>
  );
}
Text.displayName = 'Skeleton.Text';

export function Circle({
  children,
  size,
  blend,
  style,
}: {
  children?: React.ReactNode;
  size: number;
  blend?: boolean;
  style?: ViewStyle | ViewStyle[];
}) {
  const { colors } = useTheme();
  const shimmer = useShimmer();

  return (
    <Animated.View
      style={[
        styles.circle,
        {
          backgroundColor: colors.contrast50,
          width: size,
          height: size,
          opacity: Animated.multiply(shimmer, blend ? 0.6 : 1),
        },
        style,
      ]}>
      {children}
    </Animated.View>
  );
}
Circle.displayName = 'Skeleton.Circle';

export function Pill({
  size,
  blend,
  style,
}: {
  size: number;
  blend?: boolean;
  style?: ViewStyle | ViewStyle[];
}) {
  const { colors } = useTheme();
  const shimmer = useShimmer();

  return (
    <Animated.View
      style={[
        styles.pill,
        {
          backgroundColor: colors.contrast50,
          width: size * 1.618,
          height: size,
          opacity: Animated.multiply(shimmer, blend ? 0.6 : 1),
        },
        style,
      ]}
    />
  );
}
Pill.displayName = 'Skeleton.Pill';

/**
 * Generic rectangular shimmering placeholder. Use for image/card/banner
 * placeholders where neither {@link Pill} (forced `borderRadius.full`) nor
 * {@link Circle} fit. Defaults to a small borderRadius (8). Pass `0` for
 * sharp corners or any larger number / percentage string for custom shapes.
 */
export function Box({
  width,
  height,
  borderRadius = 8,
  blend,
  style,
}: {
  /** Width as a number, percentage string, or any valid RN dimension. */
  width?: DimensionValue;
  /** Height as a number, percentage string, or any valid RN dimension. */
  height?: DimensionValue;
  /**
   * Corner radius — number or percentage string. Defaults to 8. Pass 0 for
   * sharp corners.
   */
  borderRadius?: ViewStyle['borderRadius'];
  /** When true, dampens shimmer opacity (use for nested skeletons). */
  blend?: boolean;
  style?: ViewStyle | ViewStyle[];
}) {
  const { colors } = useTheme();
  const shimmer = useShimmer();

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.contrast50,
          width,
          height,
          borderRadius,
          opacity: Animated.multiply(shimmer, blend ? 0.6 : 1),
        },
        style,
      ]}
    />
  );
}
Box.displayName = 'Skeleton.Box';

export function Col({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  return <View style={[styles.col, style]}>{children}</View>;
}
Col.displayName = 'Skeleton.Col';

export function Row({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  return <View style={[styles.row, style]}>{children}</View>;
}
Row.displayName = 'Skeleton.Row';

const styles = StyleSheet.create({
  textOuter: {
    flex: 1,
  },
  textInner: {
    borderRadius: 8,
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  pill: {
    borderRadius: borderRadius.full,
  },
  col: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
});
