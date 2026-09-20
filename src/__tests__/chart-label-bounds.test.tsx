import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ComboChartCard } from '../chart-cards/ComboChartCard';
import { boundedLabelSlot } from '../chart-cards/svg-text';
import { resolvedStyle } from './support/rendered-style';

it.each(['start', 'middle', 'end'] as const)('keeps %s label slots inside the plot while preserving their anchor', (anchor) => {
  for (const plotWidth of [240, 326, 448]) {
    for (const x of [0, 4, plotWidth / 2, plotWidth - 4, plotWidth]) {
      const slot = boundedLabelSlot(plotWidth, x, anchor, 200);
      expect(slot.left).toBeGreaterThanOrEqual(0);
      expect(slot.left + slot.width).toBeLessThanOrEqual(plotWidth);
      const textAnchor = slot.left + (anchor === 'end' ? slot.width : anchor === 'middle' ? slot.width / 2 : 0);
      expect(textAnchor).toBeCloseTo(x);
    }
  }
});

it('bounds both axes and the invisible category measurement boxes on a phone', () => {
  const screen = render(<BloomThemeProvider mode="light" colorPreset="teal">
    <ComboChartCard testID="bounded-combo" data={[{ label: 'January', sessions: 40, rate: 2 }, { label: 'December', sessions: 80, rate: 4 }]}
      bar={{ key: 'sessions', label: 'Sessions' }} line={{ key: 'rate', label: 'Conversion' }} />
  </BloomThemeProvider>);
  const plot = screen.getByTestId('bounded-combo-plot');
  fireEvent(plot, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 326, height: 229 } } });
  const slots = plot.findAll(node => {
    const style = resolvedStyle(node.props.style);
    return node.props.pointerEvents === 'none' && style.position === 'absolute' && typeof style.left === 'number' && typeof style.width === 'number' && typeof style.top === 'number';
  });
  expect(slots.length).toBeGreaterThan(4);
  for (const slot of slots) {
    const style = resolvedStyle(slot.props.style);
    expect(style.left).toBeGreaterThanOrEqual(0);
    expect(Number(style.left) + Number(style.width)).toBeLessThanOrEqual(326);
  }
});
