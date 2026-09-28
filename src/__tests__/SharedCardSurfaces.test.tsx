import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { SurfaceLevelProvider, surfaceFillOn, useSurfaceFill, useSurfaceLevelValue } from '../styles/surface-levels';
import { ChartCardSurface } from '../chart-cards/primitives/ChartCardSurface';
import { useChartCardPalette, useChartCardSurfacePalette } from '../chart-cards/primitives/use-chart-palette';
import { resolveChartCardPalette } from '../chart-cards/palette';
import { ActionCardShell } from '../booking/ActionCard';
import { HousingCard } from '../tenancy/parts';
import { cardFill } from './support/card-surface';

function Probe() {
  return <Text testID="backing">{JSON.stringify({ fill: useSurfaceFill(), level: useSurfaceLevelValue() })}</Text>;
}

for (const mode of ['light', 'dark'] as const) {
  const theme = buildTheme('teal', mode);
  const parent = mode === 'dark' ? '#333333' : '#dddddd';
  it.each([['chart', ChartCardSurface], ['booking', ActionCardShell], ['housing', HousingCard]] as const)(
    `%s card publishes and paints the same nested backing in ${mode}`,
    (_name, Shell) => {
      const screen = render(<BloomThemeProvider mode={mode} colorPreset="teal"><SurfaceLevelProvider level={3} fill={parent}>
        <Shell><Probe /></Shell>
      </SurfaceLevelProvider></BloomThemeProvider>);
      const fill = surfaceFillOn(theme, parent);
      expect(JSON.parse(screen.getByTestId('backing').props.children)).toEqual({ fill, level: 3 });
      expect(cardFill(screen.UNSAFE_root)).toBe(fill);
    },
  );

  it(`chart root and parts agree on custom backing in ${mode}`, () => {
    const style = { backgroundColor: 'rgba(255, 0, 0, .5)' };
    function Parts() {
      return <Text testID="parts">{JSON.stringify(useChartCardPalette())}</Text>;
    }
    function Chart() {
      const palette = useChartCardSurfacePalette(style);
      return <ChartCardSurface style={style}><Text testID="root-palette">{JSON.stringify(palette)}</Text><Parts /></ChartCardSurface>;
    }
    const screen = render(<BloomThemeProvider mode={mode} colorPreset="teal"><SurfaceLevelProvider level={2} fill="#0000ff"><Chart /></SurfaceLevelProvider></BloomThemeProvider>);
    const root = JSON.parse(screen.getByTestId('root-palette').props.children);
    const parts = JSON.parse(screen.getByTestId('parts').props.children);
    expect(root.surface).toBe('rgb(128, 0, 128)');
    expect(parts).toEqual(root);
    expect(parts.inner).not.toBe(parts.surface);
    expect(parts.positive).toEqual(resolveChartCardPalette(theme).positive);
  });
}

it('keeps ActionCardShell measurement on its Card host', () => {
  const onLayout = jest.fn();
  const screen = render(<BloomThemeProvider mode="light" colorPreset="teal"><ActionCardShell testID="booking" onLayout={onLayout} /></BloomThemeProvider>);
  const event = { nativeEvent: { layout: { x: 0, y: 0, width: 372, height: 200 } } };
  fireEvent(screen.getByTestId('booking'), 'layout', event);
  expect(onLayout).toHaveBeenCalledWith(event);
});
