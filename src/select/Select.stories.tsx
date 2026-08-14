import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../typography';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
} from './index';

const meta: Meta = {
  title: 'Overlays/Select',
};

export default meta;

type Story = StoryObj;

type Option = { value: string; label: string; group: string };

const FRUITS: Option[] = [
  { value: 'apple', label: 'Apple', group: 'Pome' },
  { value: 'banana', label: 'Banana', group: 'Tropical' },
  { value: 'cherry', label: 'Cherry', group: 'Stone' },
  { value: 'durian', label: 'Durian', group: 'Tropical' },
  { value: 'elderberry', label: 'Elderberry', group: 'Berry' },
];

/** Enough options that the web dropdown scrolls and its scroll buttons appear. */
const MANY: Option[] = Array.from({ length: 40 }, (_, i) => ({
  value: `option-${i}`,
  label: `Option ${i + 1}`,
  group: 'All',
}));

function BasicSelect() {
  const [value, setValue] = useState<string>('apple');
  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger label="Pick a fruit">
        <SelectValue placeholder="Pick a fruit" />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent
        label="Pick a fruit"
        items={FRUITS}
        renderItem={(item) => (
          <SelectItem value={item.value} label={item.label}>
            <SelectItemIndicator />
            <SelectItemText>{item.label}</SelectItemText>
          </SelectItem>
        )}
      />
    </Select>
  );
}

function UncontrolledSelect() {
  const [value, setValue] = useState<string | undefined>(undefined);
  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger label="Pick a fruit">
        <SelectValue placeholder="No fruit selected" />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent
        label="Pick a fruit"
        items={FRUITS}
        renderItem={(item) => (
          <SelectItem value={item.value} label={item.label}>
            <SelectItemIndicator />
            <SelectItemText>{item.label}</SelectItemText>
          </SelectItem>
        )}
      />
    </Select>
  );
}

export const Basic: Story = {
  render: () => <BasicSelect />,
};

export const WithPlaceholder: Story = {
  render: () => <UncontrolledSelect />,
};

export const Composition: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <BasicSelect />
      <UncontrolledSelect />
    </View>
  ),
};

/**
 * `SelectGroup` + `SelectLabel`, shadcn's own parts for a sectioned list. The
 * group header is rendered by `renderItem` on the first row of each run, which
 * is what keeps `SelectContent`'s flat `items` API.
 */
export const Grouped: Story = {
  render: function GroupedSelect() {
    const [value, setValue] = useState<string>('cherry');
    return (
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger label="Pick a fruit">
          <SelectValue placeholder="Pick a fruit" />
          <SelectIcon />
        </SelectTrigger>
        <SelectContent
          label="Pick a fruit"
          items={FRUITS}
          renderItem={(item, index) => {
            const isFirstOfGroup = FRUITS[index - 1]?.group !== item.group;
            const row = (
              <SelectItem value={item.value} label={item.label}>
                <SelectItemIndicator />
                <SelectItemText>{item.label}</SelectItemText>
              </SelectItem>
            );
            return isFirstOfGroup ? (
              <SelectGroup>
                <SelectLabel>{item.group}</SelectLabel>
                {row}
              </SelectGroup>
            ) : (
              row
            );
          }}
        />
      </Select>
    );
  },
};

/**
 * A list longer than the dropdown's `maxHeight`. On web the options scroll and
 * `SelectScrollUpButton` / `SelectScrollDownButton` appear at whichever end has
 * more to show; on native the sheet's own list scrolls and neither renders.
 */
export const Scrollable: Story = {
  render: function ScrollableSelect() {
    const [value, setValue] = useState<string>('option-0');
    return (
      <View style={{ gap: 12 }}>
        <Text>value: {value}</Text>
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger label="Pick an option">
            <SelectValue placeholder="Pick an option" />
            <SelectIcon />
          </SelectTrigger>
          <SelectContent
            label="Pick an option"
            items={MANY}
            renderItem={(item) => (
              <SelectItem value={item.value} label={item.label}>
                <SelectItemIndicator />
                <SelectItemText>{item.label}</SelectItemText>
              </SelectItem>
            )}
          />
        </Select>
      </View>
    );
  },
};
