import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useInteractionState } from '../hooks/useInteractionState';
import { SubtleHover } from './index';

const meta: Meta<typeof SubtleHover> = {
  title: 'Components/SubtleHover',
  component: SubtleHover,
};

export default meta;

type Story = StoryObj<typeof SubtleHover>;

/** A row that washes its background as the pointer enters (web). */
function HoverRow({ label, native }: { label: string; native?: boolean }) {
  const { state: hovered, onIn, onOut } = useInteractionState();

  return (
    <Pressable
      accessibilityLabel={label}
      onHoverIn={onIn}
      onHoverOut={onOut}
      style={{
        width: 280,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <SubtleHover hover={hovered} native={native} style={{ borderRadius: 12 }} />
      <Text style={{ fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export const ListRow: Story = {
  render: () => <HoverRow label="Hover me (web)" />,
};

export const StrongerWash: Story = {
  render: () => {
    function Row() {
      const { state: hovered, onIn, onOut } = useInteractionState();
      return (
        <Pressable
          accessibilityLabel="Stronger wash"
          onHoverIn={onIn}
          onHoverOut={onOut}
          style={{ width: 280, padding: 16, borderRadius: 12, overflow: 'hidden' }}
        >
          <SubtleHover hover={hovered} opacity={0.85} style={{ borderRadius: 12 }} />
          <Text style={{ fontWeight: '600' }}>Higher opacity override</Text>
        </Pressable>
      );
    }
    return <Row />;
  },
};

export const Stack: Story = {
  render: () => (
    <View style={{ gap: 4 }}>
      <HoverRow label="Inbox" />
      <HoverRow label="Sent" />
      <HoverRow label="Drafts" />
    </View>
  ),
};
