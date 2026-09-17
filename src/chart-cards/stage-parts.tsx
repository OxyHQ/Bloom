import React, { isValidElement, useEffect, useRef, type ComponentType } from 'react';
import {
  Animated,
  Easing,
  Platform,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { BREAKPOINTS } from '../styles/breakpoints';
import { Text } from '../typography';
import { TABULAR } from './primitives/ChartHeader';
import { useChartCardPalette } from './primitives/use-chart-palette';
import { useWebTransition } from './primitives/use-web-transition';

/**
 * Parts shared by the stage-shaped cards — `BarListCard`, `StageBarsCard` and
 * `FunnelChartCard`: the fixed-column stat tile grid, hover targets that also
 * scrub on native, a width that grows in, and the icon slot.
 */

/** An icon component (`RiEyeLine`) — sized and tinted by the card. */
export type ChartIconComponent = ComponentType<{ width?: number; height?: number; fill?: string }>;

/** A leading glyph: a rendered node the caller sizes, or an icon component the card sizes and tints. */
export type ChartIcon = React.ReactNode | ChartIconComponent;

function isIconComponent(icon: ChartIcon): icon is ChartIconComponent {
  if (typeof icon === 'function') return true;
  return typeof icon === 'object' && icon !== null && !isValidElement(icon) && '$$typeof' in icon;
}

/** Renders a `ChartIcon`: a component at `size` in `color`, a node as given. */
export function renderChartIcon(icon: ChartIcon, size: number, color: string): React.ReactNode {
  if (icon === undefined || icon === null || icon === false) return null;
  if (isIconComponent(icon)) {
    const Icon = icon;
    return <Icon width={size} height={size} fill={color} />;
  }
  return icon as React.ReactNode;
}

/**
 * Hover props for one hover target: pointer enter / leave on web (and any
 * pointer device), press-and-hold on native — a finger down focuses the target,
 * letting go clears it, and a scroll may still take the gesture over.
 */
export function hoverTarget(index: number, set: (index: number | null) => void): ViewProps {
  return {
    onPointerEnter: () => set(index),
    onPointerLeave: () => set(null),
    ...(Platform.OS === 'web'
      ? null
      : {
          onStartShouldSetResponder: () => true,
          onResponderGrant: () => set(index),
          onResponderRelease: () => set(null),
          onResponderTerminate: () => set(null),
        }),
  };
}

/** Tailwind `ease-out`. */
const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);
/** The bars mount at 0 and flip on after 60ms, so the 0-width frame paints first. */
export const GROW_DELAY_MS = 60;
export const GROW_MS = 500;

/**
 * A bar width in percent that eases to `percent` over 500ms (`transition-[width]
 * duration-500 ease-out`). `mounted` false holds it at 0 — the card's first
 * frame — so it grows in once the card flips it; a bar that mounts after that
 * starts at its width, as a CSS transition would. Snaps under reduced motion.
 */
export function useGrowWidth(percent: number, mounted: boolean): Animated.AnimatedInterpolation<string> {
  const reducedMotion = useReducedMotion();
  const target = mounted ? percent : 0;
  const value = useRef(new Animated.Value(target)).current;
  useEffect(() => {
    if (reducedMotion) {
      value.setValue(target);
      return;
    }
    const animation = Animated.timing(value, {
      toValue: target,
      duration: GROW_MS,
      easing: EASE_OUT,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [target, reducedMotion, value]);
  return value.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
}

/** False for the first 60ms. */
export function useMountedAfterDelay(): boolean {
  const [mounted, setMounted] = React.useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), GROW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);
  return mounted;
}

export interface StageStatTile {
  label: string;
  /** Already formatted. */
  value: string;
  color: string;
  activeColor: string;
}

export interface StageStatTilesProps {
  items: readonly StageStatTile[];
  /** Columns from `sm` (640) up. */
  columns: number;
  /** Columns below `sm`; defaults to `columns`. */
  narrowColumns?: number;
  /** Hide the swatches (the `mono` looks). */
  swatches?: boolean;
  activeIndex: number | null;
  onActiveChange: (index: number | null) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The stat tiles under `StageBarsCard` and `FunnelChartCard`: a CSS grid of
 * `columns` equal tracks, 8px gaps, that does NOT stretch a short last row (the
 * primitive `ChartStatTiles` does) and dims the other tiles to 50% (not 40%).
 * The block bleeds 8px past the card's side padding and 4px into its bottom.
 *
 * Tile: radius 10, `background-inner`, padding 8 / 10, 1px between the name
 * row and the value. Name row: 12px swatch (radius 4, 150ms colour ease), 6px,
 * label `body-regular` text-secondary truncating. Value `body-medium`
 * text-primary tabular, one line.
 */
export function StageStatTiles({
  items,
  columns,
  narrowColumns,
  swatches = true,
  activeIndex,
  onActiveChange,
  style,
  testID,
}: StageStatTilesProps) {
  const palette = useChartCardPalette();
  const { width } = useWindowDimensions();
  const perRow = Math.max(1, width >= BREAKPOINTS.sm ? columns : (narrowColumns ?? columns));
  const fade = useWebTransition('opacity', 200);
  const swatchEase = useWebTransition('background-color', 150);
  const hovering = activeIndex !== null;

  const rows: number[][] = [];
  for (let i = 0; i < items.length; i += perRow) {
    rows.push(Array.from({ length: Math.min(perRow, items.length - i) }, (_, k) => i + k));
  }

  return (
    <View testID={testID} style={[{ marginLeft: -8, marginRight: -8, marginBottom: -4, flexDirection: 'column', gap: 8 }, style]}>
      {rows.map((row) => (
        <View key={row[0]} style={{ flexDirection: 'row', gap: 8 }}>
          {row.map((i) => {
            const item = items[i]!;
            const active = activeIndex === i;
            return (
              <View
                key={`${item.label}-${i}`}
                testID={testID ? `${testID}-tile-${i}` : undefined}
                {...hoverTarget(i, onActiveChange)}
                style={[
                  {
                    flex: 1,
                    flexBasis: 0,
                    minWidth: 0,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 1,
                    borderRadius: 10,
                    backgroundColor: palette.inner,
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingTop: 8,
                    paddingBottom: 8,
                    opacity: hovering && !active ? 0.5 : 1,
                  },
                  fade,
                ]}>
                <View style={{ minWidth: 0, maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {swatches ? (
                    <View
                      style={[
                        {
                          width: 12,
                          height: 12,
                          flexShrink: 0,
                          borderRadius: 4,
                          backgroundColor: active ? item.activeColor : item.color,
                        },
                        swatchEase,
                      ]}
                    />
                  ) : null}
                  <Text variant="body-regular" numberOfLines={1} style={{ flexShrink: 1, color: palette.textSecondary }}>
                    {item.label}
                  </Text>
                </View>
                <Text variant="body-medium" numberOfLines={1} style={[{ color: palette.text }, TABULAR]}>
                  {item.value}
                </Text>
              </View>
            );
          })}
          {/* Empty tracks keep a short last row on the grid instead of stretching it; they
              carry the tiles' side padding because flex shares out space after it. */}
          {Array.from({ length: perRow - row.length }, (_, k) => (
            <View key={`empty-${k}`} style={{ flex: 1, flexBasis: 0, minWidth: 0, paddingLeft: 10, paddingRight: 10 }} />
          ))}
        </View>
      ))}
    </View>
  );
}
