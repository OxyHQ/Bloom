import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ButtonGroup, ButtonGroupItem } from './index';
import { RiAddLine as Plus, RiArrowLeftLine as ArrowLeft, RiArrowRightLine as ArrowRight } from '../icons/remix';

const meta: Meta<typeof ButtonGroup> = {
  title: 'Base/Button Group',
  component: ButtonGroup,
};

export default meta;

type Story = StoryObj<typeof ButtonGroup>;

export const Basic: Story = {
  render: () => (
    <ButtonGroup accessibilityLabel="Alignment">
      <ButtonGroupItem>Left</ButtonGroupItem>
      <ButtonGroupItem>Center</ButtonGroupItem>
      <ButtonGroupItem>Right</ButtonGroupItem>
    </ButtonGroup>
  ),
};

function SelectableGroup({ size }: { size: 'medium' | 'small' }) {
  const [selected, setSelected] = useState('week');
  return (
    <ButtonGroup size={size} accessibilityLabel="Range">
      {['day', 'week', 'month'].map((value) => (
        <ButtonGroupItem key={value} selected={selected === value} onPress={() => setSelected(value)}>
          {value[0]?.toUpperCase() + value.slice(1)}
        </ButtonGroupItem>
      ))}
    </ButtonGroup>
  );
}

/** Every shape, at both sizes. */
export const Matrix: Story = {
  render: () => (
    <View style={{ gap: 20, alignItems: 'flex-start' }}>
      {(['medium', 'small'] as const).map((size) => (
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
