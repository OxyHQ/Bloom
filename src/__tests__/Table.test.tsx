import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '../table';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function people(size?: 'sm' | 'md', onSort?: () => void) {
  return (
    <Table size={size} accessibilityLabel="People" testID="table">
      <TableHeader testID="header">
        <TableColumn width={200} onSort={onSort} sortDirection="ascending" testID="col-name">
          Name
        </TableColumn>
        <TableColumn flex={2} align="end" testID="col-role">
          Role
        </TableColumn>
      </TableHeader>
      <TableBody>
        <TableRow testID="row-1">
          <TableCell testID="cell-1-name">Olivia</TableCell>
          <TableCell testID="cell-1-role">Designer</TableCell>
        </TableRow>
        <TableRow testID="row-2" selected>
          <TableCell testID="cell-2-name">Phoenix</TableCell>
          <TableCell testID="cell-2-role" width={80}>
            Engineer
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

describe('Table', () => {
  it('uses ARIA table roles and names the table', () => {
    const { getByTestId } = renderWithTheme(people());
    expect(getByTestId('table').props.role).toBe('table');
    expect(getByTestId('table').props.accessibilityLabel).toBe('People');
    expect(getByTestId('header').props.role).toBe('row');
    expect(getByTestId('col-role').props.role).toBe('columnheader');
    expect(getByTestId('row-1').props.role).toBe('row');
    expect(getByTestId('cell-1-name').props.role).toBe('cell');
  });

  it('pads cells 10/12 at md and 6/10 at sm, in longhands', () => {
    const md = renderWithTheme(people('md'));
    expect(resolvedStyle(md.getByTestId('cell-1-name').props.style)).toMatchObject({
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 12,
      paddingRight: 12,
    });
    md.unmount();
    const sm = renderWithTheme(people('sm'));
    const style = resolvedStyle(sm.getByTestId('cell-1-name').props.style);
    expect(style).toMatchObject({ paddingTop: 6, paddingLeft: 10 });
    expect(style.paddingHorizontal).toBeUndefined();
    const text = sm.getByText('Olivia');
    expect(resolvedStyle(text.props.style)).toMatchObject({
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500',
    });
  });

  it('applies the header column layout to every row, with a per-cell override', () => {
    const { getByTestId } = renderWithTheme(people());
    expect(resolvedStyle(getByTestId('cell-1-name').props.style).width).toBe(200);
    const role = resolvedStyle(getByTestId('cell-1-role').props.style);
    expect(role.flexGrow).toBe(2);
    expect(role.alignItems).toBe('flex-end');
    expect(resolvedStyle(getByTestId('cell-2-role').props.style).width).toBe(80);
  });

  it('draws hairlines above and below the header and only BETWEEN body rows', () => {
    const { getByTestId } = renderWithTheme(people());
    const header = resolvedStyle(getByTestId('header').props.style);
    expect(header.borderTopWidth).toBe(1);
    expect(header.borderBottomWidth).toBe(1);
    expect(resolvedStyle(getByTestId('row-1').props.style).borderBottomWidth).toBe(1);
    expect(resolvedStyle(getByTestId('row-2').props.style).borderBottomWidth).toBe(0);
  });

  it('paints a selected row and announces selection with both spellings, only when opted in', () => {
    const { getByTestId } = renderWithTheme(people());
    const selected = getByTestId('row-2');
    expect(selected.props['aria-selected']).toBe(true);
    expect(selected.props.accessibilityState).toEqual({ selected: true });
    expect(resolvedStyle(selected.props.style).backgroundColor).toBeDefined();
    const plain = getByTestId('row-1');
    expect(plain.props['aria-selected']).toBeUndefined();
    expect(plain.props.accessibilityState).toBeUndefined();
    expect(resolvedStyle(plain.props.style).backgroundColor).toBeUndefined();
    // The selected surface is the header's surface (background-secondary-default).
    expect(resolvedStyle(selected.props.style).backgroundColor).toBe(
      resolvedStyle(getByTestId('header').props.style).backgroundColor,
    );
  });

  it('turns a sortable header into a named button carrying aria-sort', () => {
    const onSort = jest.fn();
    const { getByTestId, getByLabelText } = renderWithTheme(people('md', onSort));
    expect(getByTestId('col-name').props['aria-sort']).toBe('ascending');
    expect(getByTestId('col-role').props['aria-sort']).toBeUndefined();
    const button = getByLabelText('Name');
    expect(button.props.role).toBe('button');
    pressHost(button);
    expect(onSort).toHaveBeenCalledTimes(1);
  });

  it("shows the sort chevron on the sorted column alone, keeping an unsorted one's room", () => {
    const { getByTestId } = renderWithTheme(
      <Table>
        <TableHeader>
          <TableColumn onSort={() => {}} sortDirection="descending" testID="col-sorted">
            Name
          </TableColumn>
          <TableColumn onSort={() => {}} testID="col-unsorted">
            Size
          </TableColumn>
        </TableHeader>
      </Table>,
    );
    const chevron = (column: string) =>
      getByTestId(column).find((node) => node.props.testID === 'bloom-table-sort-chevron');
    expect(resolvedStyle(chevron('col-sorted').props.style).opacity).toBeUndefined();
    expect(resolvedStyle(chevron('col-unsorted').props.style).opacity).toBe(0);
  });

  it('draws `leading` beside the sort button, not inside it, and lets an auto column hug', () => {
    const { getByLabelText, getByTestId } = renderWithTheme(
      <Table>
        <TableHeader>
          <TableColumn
            leading={<Text testID="select-all">all</Text>}
            onSort={() => {}}
            accessibilityLabel="Sort by name"
          >
            Name
          </TableColumn>
          <TableColumn width="auto" testID="col-actions">
            Actions
          </TableColumn>
        </TableHeader>
      </Table>,
    );
    const button = getByLabelText('Sort by name');
    expect(button.findAll((node) => node.props.testID === 'select-all')).toHaveLength(0);
    expect(getByTestId('select-all')).toBeTruthy();
    const auto = resolvedStyle(getByTestId('col-actions').props.style);
    expect(auto).toMatchObject({ flexGrow: 0, flexShrink: 0 });
    expect(auto.flexBasis).toBeUndefined();
    expect(auto.width).toBeUndefined();
  });

  it('shows the empty state when the body has no rows', () => {
    const { getByText } = renderWithTheme(
      <Table>
        <TableHeader>
          <TableColumn>Name</TableColumn>
        </TableHeader>
        <TableBody emptyState="Nothing here" />
      </Table>,
    );
    expect(getByText('Nothing here')).toBeTruthy();
  });

  it('renders element children verbatim and differs between light and dark', () => {
    const light = renderWithTheme(people());
    const lightHeader = resolvedStyle(light.getByTestId('header').props.style).backgroundColor;
    light.unmount();
    const dark = renderWithTheme(
      <Table>
        <TableHeader testID="header">
          <TableColumn>
            <Text testID="custom">Custom</Text>
          </TableColumn>
        </TableHeader>
      </Table>,
      'dark',
    );
    expect(dark.getByTestId('custom')).toBeTruthy();
    expect(resolvedStyle(dark.getByTestId('header').props.style).backgroundColor).not.toBe(
      lightHeader,
    );
  });
});
