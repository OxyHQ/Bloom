import { useMemo } from 'react';

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
  return useMemo(() => resolveChartCardPalette(theme), [theme]);
}

/** The eight default series tones, in `CHART_TONES` order, on the current theme. */
export function useChartTones(): ChartSeriesTone[] {
  const theme = useTheme();
  return useMemo(() => resolveChartTones(theme), [theme]);
}

/** `MONO_TONE` on the current theme. */
export function useMonoTone(): ChartSeriesTone {
  const theme = useTheme();
  return useMemo(() => resolveMonoTone(theme), [theme]);
}
