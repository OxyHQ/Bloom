import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { ResponsiveGrid } from '../grid';
import { ChartCardSurface } from '../chart-cards/primitives/ChartCardSurface';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function contents() {
  return ['a', 'b', 'c', 'd', 'e'].map((id) => <Text key={id}>{id}</Text>);
}

it('wraps equal cells at the measured container threshold and shrinks back to one column', () => {
  const screen = render(<ResponsiveGrid testID="grid">{contents()}</ResponsiveGrid>);
  const resize = (width: number) =>
    fireEvent(screen.getByTestId('grid-layout'), 'layout', {
      nativeEvent: { layout: { width, height: 100 } },
    });
  expect(resolvedStyle(screen.getByTestId('grid-layout').props.style)).toMatchObject({
    flexWrap: 'wrap',
    gap: 16,
  });
  for (const [width, expected] of [
    [300, '100%'],
    [655, '100%'],
    [656, 320],
    [1040, 512],
    [2000, 992],
    [390, '100%'],
  ] as const) {
    resize(width);
    for (let index = 0; index < 5; index++) {
      expect(resolvedStyle(screen.getByTestId(`grid-cell-${index}`).props.style).width).toBe(
        expected,
      );
    }
  }
});

it('uses caller geometry and keeps children mounted across layout changes', () => {
  const mounted = jest.fn();
  function Child() {
    React.useEffect(() => {
      mounted();
    }, []);
    return <Text>Content</Text>;
  }
  const screen = render(
    <ResponsiveGrid
      testID="grid"
      minItemWidth={200}
      maxColumns={3}
      gap={10}
      style={{ padding: 20 }}
    >
      <Child />
      {contents()}
    </ResponsiveGrid>,
  );
  for (const width of [619, 620, 320]) {
    fireEvent(screen.getByTestId('grid-layout'), 'layout', {
      nativeEvent: { layout: { width, height: 100 } },
    });
    const expected = width === 619 ? 304.5 : width === 620 ? 200 : '100%';
    expect(resolvedStyle(screen.getByTestId('grid-cell-0').props.style).width).toBe(expected);
  }
  expect(mounted).toHaveBeenCalledTimes(1);
});

it('gives a single rendered child the full width', () => {
  const screen = render(
    <ResponsiveGrid testID="grid">
      {false}
      <Text>Only card</Text>
      {null}
    </ResponsiveGrid>,
  );
  fireEvent(screen.getByTestId('grid-layout'), 'layout', {
    nativeEvent: { layout: { width: 1040, height: 100 } },
  });
  expect(resolvedStyle(screen.getByTestId('grid-cell-0').props.style).width).toBe('100%');
  expect(screen.queryByTestId('grid-cell-1')).toBeNull();
});

it.each([false, true])(
  'participating surfaces stretch only in multi-column rows when opted in (%s)',
  (stretchItems) => {
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <ResponsiveGrid testID="grid" stretchItems={stretchItems}>
          <ChartCardSurface testID="fixed">
            <Text>Fixed</Text>
            <ChartCardSurface testID="nested" height={80}>
              <Text>Nested</Text>
            </ChartCardSurface>
          </ChartCardSurface>
          <ChartCardSurface testID="auto" height="auto" style={{ minHeight: 380 }}>
            <Text>Auto</Text>
          </ChartCardSurface>
        </ResponsiveGrid>
      </BloomThemeProvider>,
    );
    const resize = (width: number) =>
      fireEvent(screen.getByTestId('grid-layout'), 'layout', {
        nativeEvent: { layout: { width, height: 100 } },
      });
    resize(1040);
    expect(resolvedStyle(screen.getByTestId('fixed').props.style)).toMatchObject(
      stretchItems
        ? { height: 'auto', minHeight: 329, flexGrow: 1, flexBasis: 'auto' }
        : { height: 329 },
    );
    expect(resolvedStyle(screen.getByTestId('auto').props.style).minHeight).toBe(380);
    expect(resolvedStyle(screen.getByTestId('nested').props.style).height).toBe(80);
    resize(390);
    expect(resolvedStyle(screen.getByTestId('fixed').props.style).height).toBe(329);
    expect(resolvedStyle(screen.getByTestId('auto').props.style).height).toBeUndefined();
    expect(resolvedStyle(screen.getByTestId('auto').props.style).flexGrow).toBeUndefined();
  },
);
