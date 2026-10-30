/**
 * `Shelf layout="paged"`: the page geometry, the column-major grouping, the
 * exact page a button steps, and the cell each item learns (which is what
 * `Lockup`'s divider default reads).
 */
import { act, fireEvent, render } from '@testing-library/react-native';

import { Lockup, LockupSkeleton } from '../lockup';
import { Shelf, shelfPageColumns, useShelfCell } from '../media-shelf';
import type { ShelfCell } from '../media-shelf';
import { shelfColumns, shelfPageTarget } from '../media-shelf/shared';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

describe('paged geometry', () => {
  it('fits whole columns in the track less its insets and peek', () => {
    expect(shelfPageColumns(0, { minItemWidth: 300, gap: 20 })).toEqual({
      columns: 0,
      itemWidth: 0,
      page: 0,
    });
    // 3 × 300 + 2 × 20 = 940 fits exactly.
    expect(shelfPageColumns(940, { minItemWidth: 300, gap: 20 })).toEqual({
      columns: 3,
      itemWidth: 300,
      page: 960,
    });
    // Insets come off both sides.
    expect(shelfPageColumns(980, { minItemWidth: 300, gap: 20, inset: 20 }).columns).toBe(3);
    expect(shelfPageColumns(979, { minItemWidth: 300, gap: 20, inset: 20 }).columns).toBe(2);
    // A phone: one column, and the peek with its gap stays in view.
    const phone = shelfPageColumns(390, { minItemWidth: 280, gap: 12, inset: 16, peek: 24 });
    expect(phone.columns).toBe(1);
    expect(phone.itemWidth).toBe(390 - 32 - 24 - 12);
    // Never fewer than one column, however narrow.
    expect(shelfPageColumns(100, { minItemWidth: 300, gap: 20 }).columns).toBe(1);
  });

  it('groups items top to bottom, then across', () => {
    expect(shelfColumns([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    expect(shelfColumns([1, 2], 1)).toEqual([[1], [2]]);
    expect(shelfColumns([1, 2, 3], Infinity)).toEqual([[1], [2], [3]]);
  });

  it('steps exactly one page, to a page boundary from anywhere', () => {
    const scroll = { x: 0, viewport: 960, content: 2880 };
    expect(shelfPageTarget(scroll, 1, 960)).toBe(960);
    expect(shelfPageTarget({ ...scroll, x: 960 }, 1, 960)).toBe(1920);
    expect(shelfPageTarget({ ...scroll, x: 959.5 }, 1, 960)).toBe(1920);
    // A swipe left the track between pages: the next boundary either way.
    expect(shelfPageTarget({ ...scroll, x: 1200 }, 1, 960)).toBe(1920);
    expect(shelfPageTarget({ ...scroll, x: 1200 }, -1, 960)).toBe(960);
    expect(shelfPageTarget({ ...scroll, x: 960 }, -1, 960)).toBe(0);
    // Clamped to the track's end.
    expect(shelfPageTarget({ ...scroll, x: 1920 }, 1, 960)).toBe(1920);
  });
});

/** Dividers are decoration, hidden from assistive technology and so from the default query. */
const HIDDEN = { includeHiddenElements: true };

function CellProbe({ id }: { id: string }) {
  const cell = useShelfCell();
  return <ProbeOut id={id} cell={cell} />;
}

const seen = new Map<string, ShelfCell | null>();
function ProbeOut({ id, cell }: { id: string; cell: ShelfCell | null }) {
  seen.set(id, cell);
  return null;
}

function layoutTrack(getByTestId: (id: string) => unknown, width: number) {
  act(() => {
    fireEvent(getByTestId('s-track') as never, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width, height: 300 } },
    });
  });
}

describe('Shelf layout="paged"', () => {
  beforeEach(() => seen.clear());

  it('renders no column before the track is measured, then sized whole columns', () => {
    const { getByTestId, queryAllByTestId } = render(
      <BloomThemeProvider mode="light">
        <Shelf testID="s" title="Apps" layout="paged" rows={3} minItemWidth={300} gap={20}>
          {['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => (
            <CellProbe key={id} id={id} />
          ))}
        </Shelf>
      </BloomThemeProvider>,
    );
    expect(queryAllByTestId('s-column')).toHaveLength(0);
    layoutTrack(getByTestId, 940);
    const columns = queryAllByTestId('s-column');
    expect(columns).toHaveLength(3);
    const style = [columns[0]?.props.style].flat(Infinity) as Array<Record<string, unknown>>;
    expect(Object.assign({}, ...style).width).toBe(300);
    expect(seen.get('a')).toEqual({
      layout: 'paged',
      row: 0,
      rows: 3,
      column: 0,
      lastInColumn: false,
    });
    expect(seen.get('c')?.lastInColumn).toBe(true);
    expect(seen.get('d')).toEqual({
      layout: 'paged',
      row: 0,
      rows: 3,
      column: 1,
      lastInColumn: false,
    });
    // The last column holds one item: it is the last of its column.
    expect(seen.get('g')).toEqual({
      layout: 'paged',
      row: 0,
      rows: 3,
      column: 2,
      lastInColumn: true,
    });
  });

  it("a Lockup divides every row but its column's last; a single-row shelf divides none", () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <BloomThemeProvider mode="light">
        <Shelf testID="s" title="Apps" layout="paged" rows={2} minItemWidth={300} gap={20}>
          <Lockup key="a" testID="a" title="A" />
          <Lockup key="b" testID="b" title="B" />
          <Lockup key="c" testID="c" title="C" />
          <LockupSkeleton key="d" testID="d" />
        </Shelf>
      </BloomThemeProvider>,
    );
    layoutTrack(getByTestId, 940);
    expect(queryByTestId('a-divider', HIDDEN)).not.toBeNull();
    expect(queryByTestId('b-divider', HIDDEN)).toBeNull();
    expect(queryByTestId('c-divider', HIDDEN)).not.toBeNull();
    rerender(
      <BloomThemeProvider mode="light">
        <Shelf testID="s" title="Apps" layout="paged" rows={1} minItemWidth={300} gap={20}>
          <Lockup key="a" testID="a" title="A" />
          <Lockup key="b" testID="b" title="B" />
        </Shelf>
      </BloomThemeProvider>,
    );
    expect(queryByTestId('a-divider', HIDDEN)).toBeNull();
    // An explicit `divider` wins over the shelf.
    rerender(
      <BloomThemeProvider mode="light">
        <Shelf testID="s" title="Apps" layout="paged" rows={1} minItemWidth={300} gap={20}>
          <Lockup key="a" testID="a" title="A" divider />
        </Shelf>
      </BloomThemeProvider>,
    );
    expect(queryByTestId('a-divider', HIDDEN)).not.toBeNull();
  });

  it('a grid divides every row but the last of its column too', () => {
    const { getByTestId, queryByTestId } = render(
      <BloomThemeProvider mode="light">
        <Shelf testID="s" title="Apps" layout="grid" rows={Infinity} minItemWidth={300} gap={20}>
          {['a', 'b', 'c'].map((id) => (
            <Lockup key={id} testID={id} title={id} />
          ))}
        </Shelf>
      </BloomThemeProvider>,
    );
    act(() => {
      fireEvent(getByTestId('s-grid') as never, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 620, height: 300 } },
      });
    });
    // Two columns: a, b on the first row, c under a.
    expect(queryByTestId('a-divider', HIDDEN)).not.toBeNull();
    expect(queryByTestId('b-divider', HIDDEN)).toBeNull();
    expect(queryByTestId('c-divider', HIDDEN)).toBeNull();
  });

  it('outside a paged or grid shelf an item has no cell', () => {
    render(
      <BloomThemeProvider mode="light">
        <Shelf testID="s" title="Apps">
          <CellProbe id="row" />
        </Shelf>
        <CellProbe id="loose" />
      </BloomThemeProvider>,
    );
    expect(seen.get('row')).toBeNull();
    expect(seen.get('loose')).toBeNull();
  });
});
