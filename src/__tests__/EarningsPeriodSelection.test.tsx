import React from 'react';
import { act, render } from '@testing-library/react-native';
import { EarningsSummary } from '../earnings/EarningsSummary';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { EarningsChartCardProps } from '../chart-cards/EarningsChartCard';
import type { EarningsPeriod } from '../earnings/types';

let chartProps: EarningsChartCardProps;
jest.mock('../chart-cards', () => ({ EarningsChartCard: (props: EarningsChartCardProps) => { chartProps = props; return null; } }));

it('clears the active bar when the parent changes period, including when returning to the old period', () => {
  const periods: EarningsPeriod[] = [
    { id: 'week', label: 'Week', total: '€100', bars: [{ label: 'Mon', value: 10, amount: '€10' }] },
    { id: 'month', label: 'Month', total: '€900', bars: [{ label: 'First', value: 90, amount: '€90' }] },
  ];
  const ui = (period: string) => <BloomThemeProvider mode="light" colorPreset="teal"><EarningsSummary periods={periods} period={period} /></BloomThemeProvider>;
  const screen = render(ui('week'));
  act(() => chartProps.onActiveIndexChange!(0));
  expect(chartProps.activeIndex).toBe(0);
  expect(chartProps.format!(0)).toBe('€10');
  screen.rerender(ui('month'));
  expect(chartProps.activeIndex).toBeNull();
  expect(chartProps.format!(0)).toBe('€900');
  screen.rerender(ui('week'));
  expect(chartProps.activeIndex).toBeNull();
  expect(chartProps.format!(0)).toBe('€100');
});
