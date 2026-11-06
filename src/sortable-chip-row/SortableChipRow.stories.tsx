import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../typography';
import { SortableChipRow } from './SortableChipRow';
import type { SortableChipItem } from './types';

const meta: Meta = {
  id: 'base-sortable-chip-row',
  title: 'Components/Chips/Sortable Chip Row',
};

export default meta;

type Story = StoryObj;

const LINKS = ['Website', 'Shop', 'Newsletter', 'Podcast'];

function chip(label: string): SortableChipItem {
  return {
    key: label,
    label,
    node: (
      <View
        style={{ borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}
      >
        <Text>{label}</Text>
      </View>
    ),
  };
}

/** Drag a chip, or focus one and use the arrow keys, to move it. */
export const Default: Story = {
  render: () => {
    const [keys, setKeys] = useState(LINKS);
    const items = keys.map(chip);
    return <SortableChipRow items={items} onReorder={setKeys} accessibilityLabel="Links" />;
  },
};

export const Disabled: Story = {
  render: () => <SortableChipRow items={LINKS.map(chip)} onReorder={() => undefined} disabled />,
};
