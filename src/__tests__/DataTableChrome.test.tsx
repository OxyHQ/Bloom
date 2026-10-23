import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { DataTable } from '../data-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '../table';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const ROWS = [{ id: 'a', name: 'Ada' }];
const COLUMNS = [{ id: 'name', header: 'Name', accessor: (r: { name: string }) => r.name }];

function renderTable(props: Record<string, unknown> = {}) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <DataTable
        accessibilityLabel="People"
        rows={ROWS}
        columns={COLUMNS}
        getRowId={(r) => r.id}
        testID="dt"
        {...props}
      />
    </BloomThemeProvider>,
  );
}

describe('DataTable chrome', () => {
  it('lets a long summary wrap instead of truncating it', () => {
    const { getByText } = renderTable({
      title: 'Total',
      summary: '48 customers matching the current filters and date range',
    });
    expect(getByText(/48 customers/).props.numberOfLines).toBeUndefined();
  });

  it('draws its own border by default and drops it with bordered={false}', () => {
    const framed = resolvedStyle(renderTable().getByTestId('dt-surface').props.style);
    expect(framed.borderWidth).toBe(1);
    expect(framed.borderRadius).toBe(16);
    expect(framed.paddingTop).toBe(8);
    const bare = resolvedStyle(
      renderTable({ bordered: false }).getByTestId('dt-surface').props.style,
    );
    expect(bare.borderWidth).toBeUndefined();
    expect(bare.borderRadius).toBeUndefined();
    expect(bare.paddingTop).toBeUndefined();
  });

  it('wraps toolbar filters on a narrow surface instead of scrolling them off', () => {
    const screen = renderTable({
      toolbar: <Text>filter</Text>,
      summary: 'x',
    });
    act(() => {
      fireEvent(screen.getByTestId('dt-surface'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 300 } },
      });
    });
    let host = screen.getByText('filter').parent;
    while (host && resolvedStyle(host.props.style).flexWrap === undefined) host = host.parent;
    const style = resolvedStyle(host?.props.style);
    expect(style.flexWrap).toBe('wrap');
    expect(style.alignSelf).toBe('stretch');
  });
});

describe('Table scroll cue', () => {
  it('fades the trailing edge while columns hide, and the leading edge once scrolled', () => {
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Table accessibilityLabel="Wide" minWidth={1000} testID="wide">
          <TableHeader>
            <TableColumn>A</TableColumn>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <Text>1</Text>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </BloomThemeProvider>,
    );
    const scroller = screen.UNSAFE_root.findAll(
      (n) => typeof n.type === 'string' && typeof n.props.onContentSizeChange === 'function',
    )[0]!;
    expect(screen.queryByTestId('wide-fade-end')).toBeNull();
    act(() => {
      fireEvent(scroller, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 100 } },
      });
      scroller.props.onContentSizeChange(1000, 100);
    });
    expect(screen.queryByTestId('wide-fade-end')).not.toBeNull();
    expect(screen.queryByTestId('wide-fade-start')).toBeNull();
    act(() => {
      fireEvent.scroll(scroller, {
        nativeEvent: {
          contentOffset: { x: 100, y: 0 },
          layoutMeasurement: { width: 360, height: 100 },
          contentSize: { width: 1000, height: 100 },
        },
      });
    });
    expect(screen.queryByTestId('wide-fade-start')).not.toBeNull();
  });
});
