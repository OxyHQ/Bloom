import React from 'react';
import { Text, FlatList, RefreshControl } from 'react-native';
import { render } from '@testing-library/react-native';

import { Screen } from '../screen';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { resolvedStyle } from './support/rendered-style';
import { VirtualList, type VirtualListHandle } from '../list';

interface Row {
  id: string;
  label: string;
}

describe('VirtualList (native)', () => {
  it('renders the header and every row through FlatList', () => {
    const data: Row[] = [
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Bravo' },
      { id: 'c', label: 'Charlie' },
    ];

    const { getByText } = render(
      <VirtualList<Row>
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
        ListHeaderComponent={<Text>Header row</Text>}
      />,
    );

    expect(getByText('Header row')).toBeTruthy();
    expect(getByText('Alpha')).toBeTruthy();
    expect(getByText('Bravo')).toBeTruthy();
    expect(getByText('Charlie')).toBeTruthy();
  });

  it('renders the empty slot (and no rows) when data is empty', () => {
    const { getByText, queryByText } = render(
      <VirtualList<Row>
        data={[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
        ListEmptyComponent={<Text>Nothing here</Text>}
      />,
    );

    expect(getByText('Nothing here')).toBeTruthy();
    expect(queryByText('Alpha')).toBeNull();
  });

  it('binds screen geometry without adding a ScrollView', () => {
    const tree = render(
      <BloomThemeProvider fonts={false}>
        <Screen header={<Text>Header</Text>} headerHeight={80}>
          <VirtualList
            screen={{}}
            testID="list"
            data={[]}
            contentContainerStyle={{ paddingBottom: 12 }}
          />
        </Screen>
      </BloomThemeProvider>,
    );
    expect(
      resolvedStyle(tree.UNSAFE_getByType(FlatList).props.contentContainerStyle),
    ).toMatchObject({ paddingTop: 80, paddingBottom: 28 });
  });

  it("maps data sticky indices onto FlatList's cells: the header, then grid rows", () => {
    const tree = render(
      <VirtualList
        data={['a', 'b', 'c', 'd', 'e', 'f']}
        numColumns={2}
        stickyHeaderIndices={[0, 4]}
        ListHeaderComponent={<Text>Header row</Text>}
        renderItem={({ item }) => <Text>{item}</Text>}
      />,
    );
    expect(tree.UNSAFE_getByType(FlatList).props.stickyHeaderIndices).toEqual([1, 3]);
  });

  it("tints the pull-to-refresh spinner with the theme's primary colour", () => {
    let primary: string | undefined;
    function Probe() {
      primary = useTheme().colors.primary;
      return null;
    }
    const tree = render(
      <BloomThemeProvider fonts={false}>
        <Probe />
        <VirtualList data={[]} refreshing={false} onRefresh={() => {}} />
      </BloomThemeProvider>,
    );
    const spinner = tree.UNSAFE_getByType(FlatList).props.refreshControl;
    expect(spinner.type).toBe(RefreshControl);
    expect(spinner.props).toMatchObject({ tintColor: primary, colors: [primary] });
  });

  it('exposes an imperative scroll handle via ref', () => {
    const ref = React.createRef<VirtualListHandle>();

    render(
      <VirtualList<Row>
        ref={ref}
        data={[{ id: 'a', label: 'Alpha' }]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
      />,
    );

    expect(typeof ref.current?.scrollToOffset).toBe('function');
    expect(typeof ref.current?.scrollTo).toBe('function');
    // The FlatList mock does not implement scrollToOffset; calling the handle
    // must be a safe no-op (optional-chained internal ref), never a throw.
    expect(() => ref.current?.scrollToOffset({ offset: 0 })).not.toThrow();
  });
});
