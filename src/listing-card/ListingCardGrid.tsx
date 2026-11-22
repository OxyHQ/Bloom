import { Children, isValidElement, memo, useCallback, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { IS_WEB } from '../styles/platform';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { webDataSet } from '../styles/web-data';
import type { ListingCardGridDensity, ListingCardGridProps } from './types';

/**
 * A results grid for `ListingCard`s, laid out by its OWN width, so a grid
 * beside a map or inside a sheet counts the room it actually has.
 *
 *   results   1 column, 2 from 500, 3 from 950, 4 from 1280; gaps 24 × 40
 *   compact   2 columns, 3 from 640, 4 from 950; gaps 16 × 24 (collections)
 *
 * The web grid is a CSS container (`container-type: inline-size`) and its cells
 * take their widths from container queries, so nothing is measured there.
 * Native measures the grid's width (`onLayout`) and picks the column count.
 *
 * Gutters are the cell's own padding inside a row pulled out by the same
 * amount, so a half-width cell is exactly half the grid less one gutter.
 */
/** Columns by the grid's width: widest first, the first breakpoint reached wins. */
const COLUMNS: Record<ListingCardGridDensity, readonly (readonly [number, number])[]> = {
  results: [
    [1280, 4],
    [950, 3],
    [500, 2],
    [0, 1],
  ],
  compact: [
    [950, 4],
    [640, 3],
    [0, 2],
  ],
};

/** A cell's width at `columns`: the web's exact fraction, native's rounded percentage. */
function cellWidthOf(columns: number, web: boolean): string {
  if (columns === 1) return '100%';
  return web ? `calc(1 / ${columns} * 100%)` : `${Number((100 / columns).toFixed(4))}%`;
}

const styles = StyleSheet.create({
  grid: { width: '100%' },
  resultsRow: { marginInline: -12, flexDirection: 'row', flexWrap: 'wrap', rowGap: 40 },
  compactRow: { marginInline: -8, flexDirection: 'row', flexWrap: 'wrap', rowGap: 24 },
  resultsCell: { paddingInline: 12 },
  compactCell: { paddingInline: 8 },
});

const ROW = { results: styles.resultsRow, compact: styles.compactRow } as const;
const CELL = { results: styles.resultsCell, compact: styles.compactCell } as const;

function webColumns(density: ListingCardGridDensity): string {
  return COLUMNS[density]
    .map(([from, columns]) => {
      const rule = `[data-bloom-listing-cell="${density}"] { width: ${cellWidthOf(columns, true)}; }`;
      return from === 0 ? rule : `@container (width >= ${from}px) { ${rule} }`;
    })
    .reverse()
    .join('\n');
}

const WEB_CSS = `[data-bloom-listing-grid] { container-type: inline-size; }
${webColumns('results')}
${webColumns('compact')}`;

function cellWidth(density: ListingCardGridDensity, width: number): string | undefined {
  const columns = COLUMNS[density].find(([from]) => width >= from)?.[1];
  return columns === undefined ? undefined : cellWidthOf(columns, false);
}

function ListingCardGridComponent({
  children,
  density = 'results',
  style,
  testID,
}: ListingCardGridProps) {
  useInteractiveWebCss('bloom-listing-card-grid', WEB_CSS);
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);
  // The web's container queries size the cells; native sizes them from the measured width.
  const cell = [CELL[density], IS_WEB ? null : { width: cellWidth(density, width) }];
  return (
    <View
      {...webDataSet({ bloomListingGrid: '' })}
      onLayout={IS_WEB ? undefined : onLayout}
      style={[styles.grid, style]}
      testID={testID}
    >
      <View collapsable={false} role="list" style={ROW[density]}>
        {Children.toArray(children)
          .filter(isValidElement)
          .map((child, index) => (
            <View
              key={child.key ?? index}
              {...webDataSet({ bloomListingCell: density })}
              role="listitem"
              style={cell}
            >
              {child}
            </View>
          ))}
      </View>
    </View>
  );
}

export const ListingCardGrid = memo(ListingCardGridComponent);
ListingCardGrid.displayName = 'ListingCardGrid';
