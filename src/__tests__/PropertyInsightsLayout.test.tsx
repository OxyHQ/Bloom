/**
 * The width-driven halves of the housing parts, which the jsdom suites cannot
 * reach (react-native-web fires `onLayout` from a ResizeObserver jsdom lacks).
 * Layout events are fired by hand.
 */
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { FloorPlan, PropertyFacts } from '../listing-details';
import { EnergyLabel, NeighbourhoodScores, PriceHistoryChart } from '../property-insights';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function flat(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flat));
  return style && typeof style === 'object' ? (style as Record<string, unknown>) : {};
}

const layout = (width: number, height = 200) => ({ nativeEvent: { layout: { x: 0, y: 0, width, height } } });

const FACTS = Array.from({ length: 6 }, (_, i) => ({ label: `Fact ${i}`, value: String(i) }));

it('PropertyFacts auto: 2 columns until measured, 3 from 480, 4 from 720', () => {
  const api = renderWithTheme(<PropertyFacts items={FACTS} testID="pf" />);
  const width = () => flat(api.getByTestId('pf-item-0').props.style).width;
  expect(width()).toBe('50%');
  act(() => fireEvent(api.getByTestId('pf'), 'layout', layout(480)));
  expect(width()).toBe(`${100 / 3}%`);
  act(() => fireEvent(api.getByTestId('pf'), 'layout', layout(720)));
  expect(width()).toBe('25%');
});

it('FloorPlan auto: one column below 560, two from 560', () => {
  const plans = [
    { source: 'https://example.test/a.png', label: 'A' },
    { source: 'https://example.test/b.png', label: 'B' },
  ];
  const api = renderWithTheme(<FloorPlan plans={plans} testID="fp" />);
  const width = () => flat(api.getByTestId('fp-item-0').props.style).width;
  act(() => fireEvent(api.getByTestId('fp'), 'layout', layout(559)));
  expect(width()).toBe('100%');
  act(() => fireEvent(api.getByTestId('fp'), 'layout', layout(560)));
  expect(width()).toBe('50%');
});

it('EnergyLabel with two ratings moves the values into the tags from 560 wide', () => {
  const api = renderWithTheme(
    <EnergyLabel consumption={{ rating: 'C', value: '112 kWh' }} emissions={{ rating: 'D', value: '24 kg' }} testID="e" />,
  );
  const tagText = () => api.getByTestId('e-consumption-tag-body').props.children.props.children;
  act(() => fireEvent(api.getByTestId('e'), 'layout', layout(390)));
  expect(tagText()).toBe('C');
  expect(api.getByTestId('e-values')).toBeTruthy();
  act(() => fireEvent(api.getByTestId('e'), 'layout', layout(560)));
  expect(tagText()).toBe('C · 112 kWh');
  expect(api.queryByTestId('e-values')).toBeNull();
});

it('NeighbourhoodScores auto: two columns from 560', () => {
  const api = renderWithTheme(<NeighbourhoodScores items={[{ label: 'A', value: 5 }, { label: 'B', value: 6 }]} testID="ns" />);
  act(() => fireEvent(api.getByTestId('ns'), 'layout', layout(560)));
  expect(flat(api.getByTestId('ns-item-0').props.style).width).toBe('50%');
});

it('PriceHistoryChart: once measured, the plot is an image named by the composed summary, with markers and the callout', () => {
  const api = renderWithTheme(
    <PriceHistoryChart
      data={[
        { label: 'Sep', value: 405000, title: 'September 2025' },
        { label: 'Mar', value: 385000, title: 'March 2026' },
      ]}
      events={[{ index: 1, kind: 'price-drop', label: 'Price drop −5%' }]}
      testID="ph"
    />,
  );
  act(() => fireEvent(api.getByTestId('ph-plot'), 'layout', layout(600, 200)));
  const surface = api.getByTestId('ph-plot-surface');
  expect(surface.props.accessibilityLabel ?? surface.props['aria-label']).toBe(
    'Price history: from €405,000 in September 2025 to €385,000 in March 2026. Price drop −5%, March 2026.',
  );
  expect(api.getByTestId('ph-event-0')).toBeTruthy();
  expect(api.getByTestId('ph-series').props.d).toMatch(/H.*V/);
});
