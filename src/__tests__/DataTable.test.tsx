import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { DataTable, DataTableRowAction, type DataTableColumn, type DataTableProps } from '../data-table';
import { clampPage, nextSort, sortRows } from '../data-table/sorting';
import { RiEditLine } from '../icons/remix';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

type Person = { id: string; name: string; age: number | null };

const PEOPLE: Person[] = [
  { id: 'a', name: 'Row 10', age: 30 },
  { id: 'b', name: 'Row 9', age: 41 },
  { id: 'c', name: 'Row 2', age: null },
  { id: 'd', name: 'Row 1', age: 25 },
  { id: 'e', name: 'Row 3', age: 58 },
];

const COLUMNS: DataTableColumn<Person>[] = [
  { id: 'name', header: 'Name', accessor: (p) => p.name, basis: 240 },
  { id: 'age', header: 'Age', accessor: (p) => p.age },
  { id: 'note', header: 'Note', cell: ({ row, size, selected }) => <Text>{`${row.id}:${size}:${selected}`}</Text> },
];

function renderTable(props: Partial<DataTableProps<Person>> = {}) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <DataTable
        accessibilityLabel="People"
        rows={PEOPLE}
        columns={COLUMNS}
        getRowId={(p) => p.id}
        testID="dt"
        {...props}
      />
    </BloomThemeProvider>,
  );
}

/**
 * Host nodes by `role`. RNTL's `*ByRole` queries only match ACCESSIBLE
 * elements, and a table's structural `View`s (row, cell, columnheader) are not.
 */
function hostsByRole(utils: ReturnType<typeof render>, role: string) {
  return utils.UNSAFE_root.findAll((node) => typeof node.type === 'string' && node.props.role === role);
}

/** The text of each body row's first cell, in render order. */
function firstCells(utils: ReturnType<typeof render>): string[] {
  return hostsByRole(utils, 'row')
    .slice(1)
    .map((row) => {
      const texts = row.findAll((node) => String(node.type) === 'Text');
      return String(texts[0]?.props.children);
    });
}

describe('data-table sorting helpers (TanStack defaults)', () => {
  it('starts text ascending and numbers descending, then flips, then clears', () => {
    const name = COLUMNS[0]!;
    const age = COLUMNS[1]!;
    expect(nextSort(null, name, PEOPLE)).toEqual({ columnId: 'name', direction: 'ascending' });
    expect(nextSort({ columnId: 'name', direction: 'ascending' }, name, PEOPLE)).toEqual({
      columnId: 'name',
      direction: 'descending',
    });
    expect(nextSort({ columnId: 'name', direction: 'descending' }, name, PEOPLE)).toBeNull();
    expect(nextSort(null, age, PEOPLE)).toEqual({ columnId: 'age', direction: 'descending' });
    expect(nextSort({ columnId: 'age', direction: 'descending' }, age, PEOPLE)?.direction).toBe('ascending');
    // Pressing another column replaces the sort.
    expect(nextSort({ columnId: 'name', direction: 'ascending' }, age, PEOPLE)).toEqual({
      columnId: 'age',
      direction: 'descending',
    });
    expect(nextSort(null, { ...name, sortDescFirst: true }, PEOPLE)?.direction).toBe('descending');
  });

  it('compares text alphanumerically and keeps empty values last in both directions', () => {
    expect(sortRows(PEOPLE, COLUMNS, { columnId: 'name', direction: 'ascending' }).map((p) => p.name)).toEqual([
      'Row 1',
      'Row 2',
      'Row 3',
      'Row 9',
      'Row 10',
    ]);
    expect(sortRows(PEOPLE, COLUMNS, { columnId: 'age', direction: 'descending' }).map((p) => p.id)).toEqual([
      'e',
      'b',
      'a',
      'd',
      'c',
    ]);
    expect(sortRows(PEOPLE, COLUMNS, { columnId: 'age', direction: 'ascending' }).map((p) => p.id)).toEqual([
      'd',
      'a',
      'b',
      'e',
      'c',
    ]);
    expect(sortRows(PEOPLE, COLUMNS, null)).toBe(PEOPLE);
  });

  it('clamps a page into range', () => {
    expect(clampPage(9, 5, 2)).toBe(3);
    expect(clampPage(0, 5, 2)).toBe(1);
    expect(clampPage(2, 0, 8)).toBe(1);
  });
});

describe('DataTable', () => {
  it('names the table and renders the toolbar title and summary', () => {
    const utils = renderTable({ title: 'Total Results', summary: '5 people' });
    expect(hostsByRole(utils, 'table')[0]!.props.accessibilityLabel).toBe('People');
    expect(utils.getByText('Total Results')).toBeTruthy();
    expect(utils.getByText('5 people')).toBeTruthy();
  });

  it('draws the surface: 1px border, radius 16, 8 on top, no bottom inset without a footer', () => {
    const utils = renderTable();
    const surface = utils.getByTestId('dt').children[0] as unknown as { props: { style: unknown } };
    expect(resolvedStyle(surface.props.style)).toMatchObject({
      borderWidth: 1,
      borderRadius: 16,
      paddingTop: 8,
      paddingBottom: 0,
    });
  });

  it('cycles a header through ascending, descending and unsorted', () => {
    const utils = renderTable();
    const sortName = () => hostsByRole(utils, 'button').find((b) => b.props.accessibilityLabel === 'Name')!;
    expect(firstCells(utils)).toEqual(['Row 10', 'Row 9', 'Row 2', 'Row 1', 'Row 3']);
    act(() => pressHost(sortName()));
    expect(firstCells(utils)).toEqual(['Row 1', 'Row 2', 'Row 3', 'Row 9', 'Row 10']);
    expect(hostsByRole(utils, 'columnheader')[0]!.props['aria-sort']).toBe('ascending');
    act(() => pressHost(sortName()));
    expect(firstCells(utils)[0]).toBe('Row 10');
    act(() => pressHost(sortName()));
    expect(firstCells(utils)).toEqual(['Row 10', 'Row 9', 'Row 2', 'Row 1', 'Row 3']);
  });

  it('reports a controlled sort without applying it itself', () => {
    const onSortChange = jest.fn();
    const utils = renderTable({ sort: null, onSortChange });
    const sortAge = hostsByRole(utils, 'button').find((b) => b.props.accessibilityLabel === 'Age')!;
    act(() => pressHost(sortAge));
    expect(onSortChange).toHaveBeenCalledWith({ columnId: 'age', direction: 'descending' });
    expect(firstCells(utils)[0]).toBe('Row 10');
  });

  it('pages the sorted rows and shows the footer only past one page', () => {
    const utils = renderTable({ pageSize: 2 });
    expect(firstCells(utils)).toEqual(['Row 10', 'Row 9']);
    const next = utils.getByLabelText('Go to page 2');
    act(() => pressHost(next));
    expect(firstCells(utils)).toEqual(['Row 2', 'Row 1']);

    const single = renderTable({ pageSize: 8 });
    expect(single.queryByLabelText('Go to page 2')).toBeNull();
  });

  it('selects rows, and the header checkbox selects and clears the page', () => {
    const onSelectionChange = jest.fn();
    const utils = renderTable({
      selectable: true,
      pageSize: 2,
      defaultSelectedRowIds: ['a'],
      onSelectionChange,
      getSelectRowLabel: (row) => `Select ${row.name}`,
    });
    const rows = () => hostsByRole(utils, 'row').slice(1);
    expect(rows().map((r) => r.props['aria-selected'])).toEqual([true, false]);
    expect(rows()[0]!.props.accessibilityState).toEqual({ selected: true });

    const header = utils.getByLabelText('Select all rows on this page');
    expect(header.props['aria-checked']).toBe('mixed');

    act(() => pressHost(utils.getByLabelText('Select Row 9')));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b']);
    expect(rows().map((r) => r.props['aria-selected'])).toEqual([true, true]);

    act(() => pressHost(utils.getByLabelText('Select all rows on this page')));
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);

    act(() => pressHost(utils.getByLabelText('Select all rows on this page')));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b']);
    expect(utils.getByLabelText('Select all rows on this page').props['aria-checked']).toBe(true);
  });

  it('keeps the first column sortable beside the selection checkbox', () => {
    const utils = renderTable({ selectable: true });
    const sortName = hostsByRole(utils, 'button').find((b) => b.props.accessibilityLabel === 'Name')!;
    act(() => pressHost(sortName));
    expect(firstCells(utils)).toEqual(['Row 1', 'Row 2', 'Row 3', 'Row 9', 'Row 10']);
    expect(sortName.props['aria-sort']).toBe('ascending');
  });

  it('keeps rows out of selection semantics when the table is not selectable', () => {
    const utils = renderTable();
    expect(hostsByRole(utils, 'row').slice(1)[0]!.props['aria-selected']).toBeUndefined();
    expect(utils.queryByLabelText('Select all rows on this page')).toBeNull();
  });

  it('hands cell renderers the row, the density and the selection', () => {
    const utils = renderTable({ selectable: true, defaultSelectedRowIds: ['b'], defaultSize: 'sm' });
    expect(utils.getByText('a:sm:false')).toBeTruthy();
    expect(utils.getByText('b:sm:true')).toBeTruthy();
  });

  it('sizes a `basis` column proportionally in the header and every row', () => {
    const utils = renderTable();
    const style = resolvedStyle(hostsByRole(utils, 'columnheader')[0]!.props.style);
    expect(style).toMatchObject({ flexBasis: 240, flexGrow: 240, flexShrink: 1 });
    const cell = resolvedStyle(hostsByRole(utils, 'cell')[0]!.props.style);
    expect(cell).toMatchObject({ flexBasis: 240, flexGrow: 240 });
  });

  it('shows the empty state with no rows', () => {
    const utils = renderTable({ rows: [], emptyState: 'Nothing here.' });
    expect(utils.getByText('Nothing here.')).toBeTruthy();
    expect(utils.queryByLabelText('Go to page 2')).toBeNull();
  });

  it('switches density from the size toggle', () => {
    const onSizeChange = jest.fn();
    const utils = renderTable({ showSizeToggle: true, onSizeChange });
    expect(utils.getByText('Compact')).toBeTruthy();
    const target = hostsByRole(utils, 'radio')[1]!;
    act(() => pressHost(target));
    expect(onSizeChange).toHaveBeenCalledWith('sm');
    expect(utils.getByText('a:sm:false')).toBeTruthy();
  });
});

describe('DataTable layout="inset"', () => {
  const rowsOf = (utils: ReturnType<typeof render>) => hostsByRole(utils, 'row');
  /** The View wrapping the pagination footer: `px-3 pt-3` under the table. */
  const footerOf = (utils: ReturnType<typeof render>) =>
    utils.UNSAFE_root.findAll((node) => {
      if (typeof node.type !== 'string') return false;
      const style = resolvedStyle(node.props.style);
      return style.paddingTop === 12 && style.paddingLeft === 12 && 'borderTopWidth' in style;
    })[0];

  it('insets the header and rows 12 and lays the first column flush against the gutter', () => {
    const utils = renderTable({ layout: 'inset', selectable: true });
    const [header, ...body] = rowsOf(utils);
    expect(resolvedStyle(header!.props.style)).toMatchObject({ paddingLeft: 12 });
    for (const row of body) expect(resolvedStyle(row.props.style)).toMatchObject({ marginLeft: 12 });
    expect(resolvedStyle(hostsByRole(utils, 'columnheader')[0]!.props.style)).toMatchObject({
      paddingLeft: 0,
      paddingRight: 0,
    });
    expect(resolvedStyle(hostsByRole(utils, 'columnheader')[1]!.props.style)).toMatchObject({
      paddingLeft: 12,
      paddingRight: 12,
    });
    expect(resolvedStyle(hostsByRole(utils, 'cell')[0]!.props.style)).toMatchObject({ paddingLeft: 0, paddingRight: 0 });
  });

  it('keeps the default table layout unchanged', () => {
    const utils = renderTable({ selectable: true, defaultSelectedRowIds: ['a'] });
    const [header, first] = rowsOf(utils);
    expect(resolvedStyle(header!.props.style).paddingLeft).toBeUndefined();
    expect(resolvedStyle(first!.props.style).marginLeft).toBeUndefined();
    expect(resolvedStyle(first!.props.style).backgroundColor).not.toBe('transparent');
    expect(resolvedStyle(hostsByRole(utils, 'columnheader')[0]!.props.style)).toMatchObject({ paddingLeft: 12 });
  });

  it('draws a hairline under the last row while paginated, and none on the footer', () => {
    const paged = renderTable({ layout: 'inset', pageSize: 2 });
    const pagedRows = rowsOf(paged).slice(1);
    expect(pagedRows.map((r) => resolvedStyle(r.props.style).borderBottomWidth)).toEqual([1, 1]);
    expect(resolvedStyle(footerOf(paged)!.props.style).borderTopWidth).toBe(0);

    const single = renderTable({ layout: 'inset' });
    const singleRows = rowsOf(single).slice(1);
    expect(singleRows.map((r) => resolvedStyle(r.props.style).borderBottomWidth)).toEqual([1, 1, 1, 1, 0]);

    const table = renderTable({ pageSize: 2 });
    expect(resolvedStyle(footerOf(table)!.props.style).borderTopWidth).toBe(1);
  });

  it('announces selection without painting the selected row', () => {
    const utils = renderTable({ layout: 'inset', selectable: true, defaultSelectedRowIds: ['a'] });
    const first = rowsOf(utils)[1]!;
    expect(first.props['aria-selected']).toBe(true);
    expect(resolvedStyle(first.props.style).backgroundColor).toBe('transparent');
  });

  it('reads the sorted header label in the primary text colour, keeping its name', () => {
    const utils = renderTable({ layout: 'inset' });
    const labelColor = (text: string) => resolvedStyle(utils.getByText(text).props.style).color;
    const resting = labelColor('Name');
    expect(resting).toBe(labelColor('Age'));
    const sortName = hostsByRole(utils, 'button').find((b) => b.props.accessibilityLabel === 'Name')!;
    act(() => pressHost(sortName));
    expect(labelColor('Name')).not.toBe(resting);
    expect(labelColor('Age')).toBe(resting);
    expect(hostsByRole(utils, 'button').some((b) => b.props.accessibilityLabel === 'Name')).toBe(true);
  });

  it('shows the empty state in a 40px-padded band instead of the 160px one', () => {
    const utils = renderTable({ layout: 'inset', rows: [], emptyState: 'Nothing here.' });
    let node = utils.getByText('Nothing here.').parent;
    while (node && !(typeof node.type === 'string' && resolvedStyle(node.props.style).paddingTop === 40)) {
      node = node.parent;
    }
    expect(node).toBeTruthy();
    expect(resolvedStyle(node!.props.style)).toMatchObject({ paddingBottom: 40, paddingLeft: 12, paddingRight: 12 });
    expect(resolvedStyle(node!.props.style).height).toBeUndefined();
  });
});

describe('DataTableRowAction', () => {
  it('is a named icon-only button that forwards its press', () => {
    const onPress = jest.fn();
    const utils = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <DataTableRowAction icon={RiEditLine} label="Edit" onPress={onPress} testID="edit" />
      </BloomThemeProvider>,
    );
    const host = utils.getByLabelText('Edit');
    act(() => pressHost(host));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
