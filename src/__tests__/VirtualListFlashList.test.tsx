import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { Screen } from '../screen';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';
import { VirtualList, type VirtualListHandle } from '../list';

// The optional peer, installed. Bloom does not install it itself, hence virtual.
const mockScrollToOffset = jest.fn();
jest.mock(
  '@shopify/flash-list',
  () => {
    const { createElement, forwardRef, useImperativeHandle } = jest.requireActual('react');
    const FlashList = forwardRef(
      (
        props: {
          data: { id: string }[];
          renderItem: (info: { item: unknown; index: number }) => unknown;
        },
        ref: unknown,
      ) => {
        useImperativeHandle(ref, () => ({ scrollToOffset: mockScrollToOffset }));
        return createElement(
          'FlashList',
          null,
          props.data.map((item, index) => props.renderItem({ item, index })),
        );
      },
    );
    return { FlashList };
  },
  { virtual: true },
);

it('renders through FlashList when it is installed, with the same Screen binding and handle', () => {
  const { FlashList } = jest.requireMock('@shopify/flash-list');
  const ref = React.createRef<VirtualListHandle>();
  const getItemType = () => 'row';
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <Screen header={<Text>Header</Text>} headerHeight={80}>
        <VirtualList
          ref={ref}
          screen={{}}
          data={[{ id: 'a' }]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Text key={item.id}>Row {item.id}</Text>}
          getItemType={getItemType}
          contentContainerStyle={{ paddingBottom: 12 }}
        />
      </Screen>
    </BloomThemeProvider>,
  );
  expect(tree.getByText('Row a')).toBeTruthy();
  const list = tree.UNSAFE_getByType(FlashList);
  expect(list.props.getItemType).toBe(getItemType);
  expect(resolvedStyle(list.props.contentContainerStyle)).toMatchObject({
    paddingTop: 80,
    paddingBottom: 28,
  });
  ref.current?.scrollTo({ y: 40, animated: false });
  expect(mockScrollToOffset).toHaveBeenCalledWith({ offset: 40, animated: false });
});
