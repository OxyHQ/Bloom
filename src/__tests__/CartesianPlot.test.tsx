import React from 'react';
import { act, fireEvent, render, within } from '@testing-library/react-native';

import { CartesianPlot } from '../chart-cards/primitives/CartesianPlot';
import { resolveChartCardPalette } from '../chart-cards/palette';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';

// Each X label sits in a 160-wide slot centred on its tick, so the last slot of
// a point-scale plot reaches ~80px past the plot's right edge. Unclipped, that
// empty box counted toward the document's scroll width: a price history card
// at a 390 phone's edge widened the page to 426 and scrolled sideways.

/** A deep flatten of a style prop (the jest preset's `StyleSheet.flatten` keeps arrays). */
function flat(style: unknown): Record<string, unknown> {
  if (!style || typeof style !== 'object') return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flat));
  return style as Record<string, unknown>;
}

const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

function renderPlot() {
  const palette = resolveChartCardPalette(buildTheme('teal', 'light'));
  const utils = render(
    <BloomThemeProvider mode="light">
      <CartesianPlot
        categories={MONTHS}
        yAxisWidth={44}
        yDomain={[0, 100]}
        yTicks={[0, 50, 100]}
        formatYTick={String}
        onActiveIndexChange={() => undefined}
        palette={palette}
        accessibilityLabel="Plot"
        testID="plot"
      >
        {() => null}
      </CartesianPlot>
    </BloomThemeProvider>,
  );
  act(() => {
    fireEvent(utils.getByTestId('plot'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 326, height: 200 } } });
  });
  return utils;
}

describe('CartesianPlot x-axis labels', () => {
  it('draws the labels inside a layer that fills the plot and clips', () => {
    const { getByTestId } = renderPlot();
    const layer = getByTestId('plot-x-labels');
    const style = flat(layer.props.style);
    expect(style).toMatchObject({ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' });
    for (const month of MONTHS) expect(within(layer).getByText(month)).toBeTruthy();
  });

  it('still reaches past the plot with the last slot, which is why the layer clips', () => {
    const { getByTestId } = renderPlot();
    const layer = getByTestId('plot-x-labels');
    let slot = within(layer).getByText('Apr').parent;
    while (slot && typeof flat(slot.props.style).left !== 'number') slot = slot.parent;
    const { left, width } = flat(slot?.props.style) as { left: number; width: number };
    expect(left + width).toBeGreaterThan(326);
  });
});
