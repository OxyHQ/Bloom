import React, { useCallback, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import type { ResponsiveGridProps } from './types';
import { GridItemStretchContext } from './context';

/** Equal-width columns chosen from the space this grid actually receives. */
export function ResponsiveGrid({
  children,
  minItemWidth = 320,
  maxColumns = 2,
  gap = 16,
  stretchItems = false,
  style,
  testID,
}: ResponsiveGridProps) {
  const [width, setWidth] = useState(0);
  const measure = useCallback((event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width;
    setWidth(Number.isFinite(measured) ? Math.max(0, measured) : 0);
  }, []);
  const minimum = Number.isFinite(minItemWidth) && minItemWidth > 0 ? minItemWidth : 320;
  const maximum = Number.isFinite(maxColumns) ? Math.max(1, Math.floor(maxColumns)) : 2;
  const spacing = Number.isFinite(gap) ? Math.max(0, gap) : 16;
  const items = React.Children.toArray(children);
  const columns = Math.max(
    1,
    Math.min(maximum, items.length, Math.floor((width + spacing) / (minimum + spacing))),
  );
  const cellWidth = columns === 1 ? '100%' : (width - spacing * (columns - 1)) / columns;

  return (
    <View testID={testID} style={[{ minWidth: 0 }, style]}>
      <View
        testID={testID ? `${testID}-layout` : undefined}
        onLayout={measure}
        style={{
          minWidth: 0,
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          gap: spacing,
        }}
      >
        {items.map((child, index) => (
          <View
            key={React.isValidElement(child) ? (child.key ?? index) : index}
            testID={testID ? `${testID}-cell-${index}` : undefined}
            style={{ minWidth: 0, width: cellWidth }}
          >
            <GridItemStretchContext.Provider value={stretchItems && columns > 1}>
              {child}
            </GridItemStretchContext.Provider>
          </View>
        ))}
      </View>
    </View>
  );
}
