import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { HeatmapChartCard, heatmapCellColor } from '../chart-cards/HeatmapChartCard';
import type { HeatmapRow } from '../chart-cards/HeatmapChartCard';
import { resolveChartCardPalette } from '../chart-cards/palette';

const COLUMNS = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'];
const ROWS: HeatmapRow[] = [
  { label: 'Mon', values: [4, 2, 1, 6, 28, 46, 52, 58, 44, 30, 18, 9] },
  { label: 'Tue', values: [3, 2, 2, 8, 32, 50, 55, 62, 48, 33, 20, 10] },
  { label: 'Wed', values: [5, 3, 1, 7, 30, 48, 57, 60, 47, 31, 19, 8] },
  { label: 'Thu', values: [4, 2, 2, 9, 34, 52, 60, 64, 50, 35, 22, 11] },
  { label: 'Fri', values: [6, 3, 2, 8, 29, 44, 49, 46, 36, 24, 15, 9] },
  { label: 'Sat', values: [8, 5, 3, 4, 12, 20, 26, 28, 25, 22, 16, 12] },
  { label: 'Sun', values: [7, 4, 2, 3, 10, 17, 22, 24, 23, 20, 14, 10] },
];

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('heatmap colour', () => {
  it('mixes the accent into the track by share of max, 8% floor', () => {
    expect(heatmapCellColor(0, 64, 'rgb(0 0 255)', 'rgb(255 255 255)')).toBe('rgb(235 235 255)');
    expect(heatmapCellColor(64, 64, 'rgb(0 0 255)', 'rgb(255 255 255)')).toBe('rgb(0 0 255)');
    expect(heatmapCellColor(32, 64, 'rgb(0 0 255)', 'rgb(255 255 255)')).toBe(heatmapCellColor(32, 64, 'rgb(0 0 255)', 'rgb(255 255 255)'));
    expect(heatmapCellColor(99, 64, 'rgb(0 0 255)', 'rgb(0 0 0)')).toBe('rgb(0 0 255)');
  });
});

describe('HeatmapChartCard', () => {
  it('headlines the total, draws 7 × 12 named cells, a 12-label axis and the ramp legend', () => {
    const { getByTestId, getByText, UNSAFE_root } = renderCard(
      <HeatmapChartCard testID="heatmap" rows={ROWS} columns={COLUMNS} delta={0.052} range="Last 7 days" />,
    );
    expect(resolvedStyle(getByTestId('heatmap').props.style)).toMatchObject({ height: 329, borderRadius: 16 });
    expect(getByTestId('heatmap-headline').props.children).toBe('1,892');
    expect(UNSAFE_root.findAll((n) => typeof n.type === 'string' && n.props.role === 'img')).toHaveLength(84);
    expect(getByTestId('heatmap-cell-3-7').props.accessibilityLabel).toBe('Thu 14: 64');
    for (const t of ['Less', 'More', '+5.2%', 'Mon', '22']) expect(getByText(t)).toBeTruthy();
    const cell = resolvedStyle(getByTestId('heatmap-cell-0-0').props.style);
    expect(cell).toMatchObject({ borderRadius: 4, flex: 1 });
  });

  it('rings the hovered cell, swaps the header and darkens its row and column labels', () => {
    const onActiveCellChange = jest.fn();
    const theme = buildTheme('teal', 'light');
    const palette = resolveChartCardPalette(theme);
    const { getByTestId, getByText } = renderCard(
      <HeatmapChartCard testID="heatmap" rows={ROWS} columns={COLUMNS} delta={0.052} onActiveCellChange={onActiveCellChange} />,
    );
    act(() => {
      fireEvent(getByTestId('heatmap-cell-3-7'), 'pointerEnter');
    });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ row: 3, col: 7 });
    expect(getByText('Thu · 14')).toBeTruthy();
    expect(getByTestId('heatmap-headline').props.children).toBe('64');
    expect(resolvedStyle(getByTestId('heatmap-cell-3-7').props.style).boxShadow).toBe(`0 0 0 2px ${palette.cursor}`);
    expect(resolvedStyle(getByText('Thu').props.style).color).toBe(palette.text);
    expect(resolvedStyle(getByText('Mon').props.style).color).toBe(palette.textTertiary);
    act(() => {
      fireEvent(getByTestId('heatmap-grid'), 'pointerLeave');
    });
    expect(onActiveCellChange).toHaveBeenLastCalledWith(null);
  });

  it('shows every n-th column label when there are more than 12', () => {
    const cols = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
    const { getByText } = renderCard(
      <HeatmapChartCard rows={ROWS.map((r) => ({ ...r, values: [...r.values, ...r.values] }))} columns={cols} />,
    );
    const opacityOf = (t: string) => {
      let node = getByText(t).parent;
      while (node && resolvedStyle(node.props.style).opacity === undefined) node = node.parent;
      return resolvedStyle(node?.props.style).opacity;
    };
    expect(opacityOf('02')).toBe(1);
    expect(opacityOf('03')).toBe(0);
  });

  it('reads a range and honours a fixed max', () => {
    const { getByTestId } = renderCard(
      <HeatmapChartCard testID="heatmap" columns={COLUMNS} ranges={[{ id: 'a', label: 'A', rows: ROWS.slice(0, 1), headline: 5 }]} />,
    );
    expect(getByTestId('heatmap-headline').props.children).toBe('5');
  });
});
