import { useMemo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSurfaceFill } from '../../styles/surface-levels';
import { useSurfaceLayer } from '../../surface/use-surface-layer';
import { resolveSurfaceFill } from '../../surface/shared';

import { useTheme } from '../../theme/use-theme';
import {
  resolveChartCardPalette,
  resolveChartTones,
  resolveMonoTone,
  type ChartCardPalette,
  type ChartSeriesTone,
} from '../palette';

/** The chart chrome colours (`palette.ts`) for the current theme and mode. */
export function useChartCardPalette(): ChartCardPalette {
  const theme = useTheme();
  const surface = useSurfaceFill();
  return useMemo(() => resolveChartCardPalette(theme, surface), [theme, surface]);
}

/** The nine canonical series tones, in token order, on the current theme. */
export function useChartTones(): ChartSeriesTone[] {
  const theme = useTheme();
  return useMemo(() => resolveChartTones(theme), [theme]);
}

/** `MONO_TONE` on the current theme. */
export function useMonoTone(): ChartSeriesTone {
  const theme = useTheme();
  return useMemo(() => resolveMonoTone(theme), [theme]);
}

/** Resolve chrome in the component that is ABOUT TO render its Card.
 * Descendant primitives use useChartCardPalette instead: their parent already
 * published the surface, so advancing again would invent an extra layer. */
export function useChartCardSurfacePalette(style?: StyleProp<ViewStyle>): ChartCardPalette {
  const theme = useTheme();
  const layer = useSurfaceLayer();
  const fill = StyleSheet.flatten(style)?.backgroundColor;
  const surface = resolveSurfaceFill(typeof fill === 'string' ? fill : layer.fill, false, layer.parentFill);
  return useMemo(() => resolveChartCardPalette(theme, surface), [theme, surface]);
}
