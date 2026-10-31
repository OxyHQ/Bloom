import React, { Children, isValidElement, memo } from 'react';

import { StyledView } from '../styles/styled-primitives';
import type { ListingCardGridDensity, ListingCardGridProps } from './types';

/**
 * A results grid for `ListingCard`s, laid out by CONTAINER QUERIES.
 *
 * The grid is a `@container`, so its columns follow its OWN width — a grid
 * beside a map or inside a sheet counts the room it actually has — and the
 * browser (web) or react-native-css (native) resolves them. Nothing is measured
 * or counted in JavaScript.
 *
 *   results   1 column, 2 from 500, 3 from 950, 4 from 1280; gaps 24 × 40
 *   compact   2 columns, 3 from 640, 4 from 950; gaps 16 × 24 (collections)
 *
 * Gutters are the cell's own padding inside a row pulled out by the same
 * amount, so `w-1/2` is exactly half the grid less one gutter with no `calc()`.
 * The class strings are written out whole: the app's Tailwind scans Bloom's
 * `lib` for them.
 */
const LAYOUT: Record<ListingCardGridDensity, { row: string; cell: string }> = {
  results: {
    row: '-mx-3 flex-row flex-wrap gap-y-10',
    cell: 'w-full px-3 @min-[500px]:w-1/2 @min-[950px]:w-1/3 @min-[1280px]:w-1/4',
  },
  compact: {
    row: '-mx-2 flex-row flex-wrap gap-y-6',
    cell: 'w-1/2 px-2 @min-[640px]:w-1/3 @min-[950px]:w-1/4',
  },
};

function ListingCardGridComponent({
  children,
  density = 'results',
  style,
  testID,
}: ListingCardGridProps) {
  const { row, cell } = LAYOUT[density];
  return (
    <StyledView className="@container w-full" style={style} testID={testID}>
      <StyledView collapsable={false} role="list" className={row}>
        {Children.toArray(children)
          .filter(isValidElement)
          .map((child, index) => (
            <StyledView key={child.key ?? index} role="listitem" className={cell}>
              {child}
            </StyledView>
          ))}
      </StyledView>
    </StyledView>
  );
}

export const ListingCardGrid = memo(ListingCardGridComponent);
ListingCardGrid.displayName = 'ListingCardGrid';
