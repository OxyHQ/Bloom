import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ButtonGroup, ButtonGroupItem } from './index';
import { RiAddLine as Plus, RiArrowLeftLine as ArrowLeft, RiArrowRightLine as ArrowRight } from '../icons/remix';

const meta: Meta<typeof ButtonGroup> = {
  argTypes: {
    "material": { control: 'select', options: ["solid","glass"] },
    "size": { control: 'select', options: ["sm","md"] },
    "dividers": { control: 'boolean' }
  },
  title: 'Base/Button Group',
  component: ButtonGroup,
};

export default meta;

type Story = StoryObj<typeof ButtonGroup>;

export const Basic: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ButtonGroup accessibilityLabel="Alignment">
      <ButtonGroupItem>Left</ButtonGroupItem>
      <ButtonGroupItem>Center</ButtonGroupItem>
      <ButtonGroupItem>Right</ButtonGroupItem>
    </ButtonGroup>
  ),
};

function SelectableGroup({ size }: { size: 'md' | 'sm' }) {
  const [selected, setSelected] = useState('week');
  return (
    <ButtonGroup size={size} accessibilityLabel="Range">
      {['day', 'week', 'month'].map((value) => (
        <ButtonGroupItem key={value} checked={selected === value} onPress={() => setSelected(value)}>
          {value[0]?.toUpperCase() + value.slice(1)}
        </ButtonGroupItem>
      ))}
    </ButtonGroup>
  );
}

/** Every shape, at both sizes. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 20, alignItems: 'flex-start' }}>
      {(['md', 'sm'] as const).map((size) => (
        <View key={size} style={{ gap: 12, alignItems: 'flex-start' }}>
          <ButtonGroup size={size} accessibilityLabel="Alignment">
            <ButtonGroupItem>Left</ButtonGroupItem>
            <ButtonGroupItem>Center</ButtonGroupItem>
            <ButtonGroupItem>Right</ButtonGroupItem>
          </ButtonGroup>
          <ButtonGroup size={size} accessibilityLabel="Actions">
            <ButtonGroupItem leadingIcon={Plus}>Add</ButtonGroupItem>
            <ButtonGroupItem trailingIcon={ArrowRight}>Next</ButtonGroupItem>
            <ButtonGroupItem disabled>Disabled</ButtonGroupItem>
          </ButtonGroup>
          <ButtonGroup size={size} accessibilityLabel="Pager">
            <ButtonGroupItem iconOnly leadingIcon={ArrowLeft} accessibilityLabel="Previous" />
            <ButtonGroupItem iconOnly leadingIcon={ArrowRight} accessibilityLabel="Next" />
          </ButtonGroup>
          <SelectableGroup size={size} />
        </View>
      ))}
    </View>
  ),
};

/** One pane with flush item hit targets; no nested material or default divider. */
export const Glass: Story = {
  args: { material: "glass" },
  parameters: { controls: { include: ["material","size","dividers"] } },
  render: (args) => (
    <View style={{ padding: 24, alignItems: 'flex-start', backgroundColor: '#dcece6' }}>
      <ButtonGroup {...args}  accessibilityLabel="Floating actions">
        <ButtonGroupItem iconOnly leadingIcon={ArrowLeft} accessibilityLabel="Back" />
        <ButtonGroupItem leadingIcon={Plus}>Add</ButtonGroupItem>
        <ButtonGroupItem iconOnly leadingIcon={ArrowRight} accessibilityLabel="Next" />
      </ButtonGroup>
    </View>
  ),
};
