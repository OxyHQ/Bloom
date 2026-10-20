import type React from 'react';
import { createContext, useContext, useEffect, useInsertionEffect, useMemo, useState } from 'react';
import {
  Animated,
  View,
  type ViewStyle,
  type ViewProps,
  type TextStyle,
  type DimensionValue,
  StyleSheet,
  Platform,
} from 'react-native';

import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { StyledView } from '../styles/styled-primitives';
import { useCommonMessages } from '../locale/common-messages';
import type { SkeletonRegionProps } from './types';

import { useTheme } from '../theme/use-theme';
import { borderRadius } from '../styles/tokens';
import { SUPPORTS_NATIVE_DRIVER } from '../styles/native-driver';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';

const SHIMMER_DURATION = 1500;
const SHIMMER_MIN_OPACITY = 0.4;
const SHIMMER_MAX_OPACITY = 1;

type ShimmerDriver = Animated.Value | { startedAt: number };
const ShimmerContext = createContext<ShimmerDriver | null>(null);
// RNW forwards dataSet; native ViewProps deliberately omits DOM attributes.
const WebShimmerView: React.ComponentType<
  ViewProps & { dataSet: { bloomSkeletonMotion: string } }
> = View;
// RNW Animated.View schedules a React update for every animated prop on every
// frame. Loading placeholders must not compete with Suspense's pending retry.
const shimmerCss = `
@keyframes bloom-skeleton-shimmer {
  0%, 100% { opacity: var(--bloom-skeleton-opacity, 1); }
  50% { opacity: calc(var(--bloom-skeleton-opacity, 1) * ${SHIMMER_MIN_OPACITY}); }
}
[data-bloom-skeleton-motion="animated"] {
  animation: bloom-skeleton-shimmer ${SHIMMER_DURATION}ms ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  [data-bloom-skeleton-motion="animated"] { animation: none; }
}`;
const decorative = {
  'aria-hidden': true,
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants' as const,
};

function useShimmer() {
  const inherited = useContext(ShimmerContext);
  const reducedMotion = usePrefersReducedMotion();
  const [ownDriver] = useState<ShimmerDriver>(() =>
    Platform.OS === 'web' ? { startedAt: Date.now() } : new Animated.Value(SHIMMER_MAX_OPACITY),
  );
  useInsertionEffect(() => {
    if (Platform.OS === 'web') adoptStyleSheet('bloom-skeleton-motion', shimmerCss);
  }, []);

  useEffect(() => {
    if (inherited || !(ownDriver instanceof Animated.Value)) return;
    const opacity = ownDriver;
    if (reducedMotion) {
      opacity.setValue(SHIMMER_MAX_OPACITY);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: SHIMMER_MIN_OPACITY,
          duration: SHIMMER_DURATION / 2,
          useNativeDriver: SUPPORTS_NATIVE_DRIVER,
          isInteraction: false,
        }),
        Animated.timing(opacity, {
          toValue: SHIMMER_MAX_OPACITY,
          duration: SHIMMER_DURATION / 2,
          useNativeDriver: SUPPORTS_NATIVE_DRIVER,
          isInteraction: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ownDriver, inherited, reducedMotion]);

  return inherited ?? ownDriver;
}

/** Only mount-time phase alignment uses JS; CSS owns every subsequent frame. */
function useShapeMotion(blend: boolean | undefined, style?: ViewStyle | ViewStyle[]) {
  const driver = useShimmer();
  const delay = useMemo(
    () => ('startedAt' in driver ? `${-(Date.now() - driver.startedAt)}ms` : undefined),
    [driver],
  );
  const opacity = blend ? 0.6 : 1;
  if (driver instanceof Animated.Value) {
    return { kind: 'native' as const, style: { opacity: Animated.multiply(driver, opacity) } };
  }
  const motionStyle: WebCssStyle = {
    opacity,
    '--bloom-skeleton-opacity': String(opacity),
    animationDelay: delay,
  };
  return {
    kind: 'web' as const,
    style: motionStyle,
    // An explicit caller opacity has always replaced the animated opacity.
    dataSet: {
      bloomSkeletonMotion: StyleSheet.flatten(style)?.opacity != null ? 'static' : 'animated',
    },
  };
}

function ShimmerView({
  motion,
  style,
  ...props
}: ViewProps & { motion: ReturnType<typeof useShapeMotion> }) {
  return motion.kind === 'web' ? (
    <WebShimmerView {...props} dataSet={motion.dataSet} style={[motion.style, style]} />
  ) : (
    <Animated.View {...props} style={[motion.style, style]} />
  );
}

/** One loading announcement and animation driver for a composed placeholder. */
export function Region({ children, label, testID, className, style }: SkeletonRegionProps) {
  const inherited = useContext(ShimmerContext);
  const shimmer = useShimmer();
  const common = useCommonMessages();
  return (
    <ShimmerContext.Provider value={shimmer}>
      <StyledView
        accessible={inherited ? undefined : true}
        role={inherited ? undefined : 'group'}
        accessibilityLabel={inherited ? undefined : (label ?? common.loading)}
        accessibilityState={inherited ? undefined : { busy: true }}
        aria-busy={inherited ? undefined : true}
        testID={testID}
        className={className}
        style={style}
      >
        {children}
      </StyledView>
    </ShimmerContext.Provider>
  );
}
Region.displayName = 'Skeleton.Region';

export function Text({ blend, style }: { style?: TextStyle | TextStyle[]; blend?: boolean }) {
  const { colors } = useTheme();
  const motion = useShapeMotion(blend);
  const flattened = StyleSheet.flatten(style);
  const width = (flattened as ViewStyle)?.width;
  const lineHeight = (flattened?.lineHeight as number) || 14;

  return (
    <View
      {...decorative}
      style={[
        styles.textOuter,
        { maxWidth: width as number },
        { paddingVertical: lineHeight * 0.15 },
      ]}
    >
      <ShimmerView
        motion={motion}
        style={[
          styles.textInner,
          {
            backgroundColor: colors.contrast50,
            height: lineHeight * 0.7,
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
  const motion = useShapeMotion(blend, style);

  return (
    <ShimmerView
      {...decorative}
      motion={motion}
      style={[
        styles.circle,
        {
          backgroundColor: colors.contrast50,
          width: size,
          height: size,
        },
        style,
      ]}
    >
      {children}
    </ShimmerView>
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
  const motion = useShapeMotion(blend, style);

  return (
    <ShimmerView
      {...decorative}
      motion={motion}
      style={[
        styles.pill,
        {
          backgroundColor: colors.contrast50,
          width: size * 1.618,
          height: size,
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
  const motion = useShapeMotion(blend, style);

  return (
    <ShimmerView
      {...decorative}
      motion={motion}
      style={[
        {
          backgroundColor: colors.contrast50,
          width,
          height,
          borderRadius,
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
