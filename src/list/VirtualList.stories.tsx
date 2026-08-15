import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { VirtualList } from './index';
import { Text } from '../typography';
import { Divider } from '../divider';

const meta: Meta = {
  title: 'Components/VirtualList',
};

export default meta;

type Story = StoryObj;

interface Row {
  id: string;
  title: string;
  subtitle: string;
}

const ROWS: Row[] = Array.from({ length: 200 }, (_, index) => ({
  id: String(index),
  title: `Row ${index + 1}`,
  subtitle: index % 3 === 0 ? 'Occasionally taller so heights vary' : 'One line',
}));

function RowView({ item }: { item: Row }) {
  return (
    <View style={{ paddingVertical: 12 }}>
      <Text>{item.title}</Text>
      <Text style={{ opacity: 0.6 }}>{item.subtitle}</Text>
      <Divider spacing={8} />
    </View>
  );
}

/**
 * `VirtualList` is the one list primitive: a windowed list on web and a native
 * virtualized list underneath, behind one prop shape. Use it wherever the row
 * count is unbounded — a feed, a search result, a directory.
 *
 * `estimatedItemSize` is the prop that decides whether scrolling feels right.
 * It is only a hint, but a badly wrong one makes the scrollbar jump as real
 * heights replace the estimate, so estimate the COMMON row rather than the
 * average of a bimodal set.
 */
export const Basic: Story = {
  render: () => (
    <View style={{ width: 420, height: 360 }}>
      <VirtualList<Row>
        data={ROWS}
        keyExtractor={(item) => item.id}
        estimatedItemSize={64}
        renderItem={({ item }) => <RowView item={item} />}
      />
    </View>
  ),
};

/**
 * The three slots. `ListEmptyComponent` is the one worth wiring first: an
 * unstyled empty list is indistinguishable from a list that failed to load.
 */
export const Slots: Story = {
  render: () => (
    <View style={{ width: 420, height: 320 }}>
      <VirtualList<Row>
        data={ROWS.slice(0, 4)}
        keyExtractor={(item) => item.id}
        estimatedItemSize={64}
        ListHeaderComponent={<Text style={{ fontWeight: '600' }}>Recent</Text>}
        ListFooterComponent={<Text style={{ opacity: 0.6 }}>End of list</Text>}
        renderItem={({ item }) => <RowView item={item} />}
      />
    </View>
  ),
};

/** Nothing to show. */
export const Empty: Story = {
  render: () => (
    <View style={{ width: 420, height: 200 }}>
      <VirtualList<Row>
        data={[]}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>No results for “bloom”.</Text>}
        renderItem={({ item }) => <RowView item={item} />}
      />
    </View>
  ),
};

/**
 * `onEndReached` fires once per approach to the end, not once per scroll event
 * — but it can still fire while a previous page is in flight, so the caller
 * guards on its own loading flag rather than assuming one call per page.
 */
export const InfiniteScroll: Story = {
  render: function InfiniteScrollStory() {
    const [count, setCount] = useState(20);
    return (
      <View style={{ width: 420, height: 360, gap: 8 }}>
        <Text>{count} rows loaded</Text>
        <VirtualList<Row>
          data={ROWS.slice(0, count)}
          keyExtractor={(item) => item.id}
          estimatedItemSize={64}
          onEndReachedThreshold={0.5}
          onEndReached={() => setCount((value) => Math.min(value + 20, ROWS.length))}
          renderItem={({ item }) => <RowView item={item} />}
        />
      </View>
    );
  },
};
