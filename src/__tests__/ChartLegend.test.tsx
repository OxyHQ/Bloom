import { render } from '@testing-library/react-native';
import React from 'react';
import { ChartLegend } from '../chart-cards/primitives';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

it('lets a long legend item shrink and truncate inside its row', () => {
  const { getByTestId, getByText } = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <ChartLegend
        testID="legend"
        items={[
          {
            label: 'A very long series label that would overflow a phone card',
            color: 'red',
            value: '12',
          },
        ]}
      />
    </BloomThemeProvider>,
  );
  const item = resolvedStyle(getByTestId('legend-item-0').props.style);
  expect(item.maxWidth).toBe('100%');
  expect(item.flexShrink).toBe(1);
  expect(item.minWidth).toBe(0);
  const label = resolvedStyle(getByText(/A very long/).props.style);
  expect(label.flexShrink).toBe(1);
});
