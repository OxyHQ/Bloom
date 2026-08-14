import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useInteractionState } from '../hooks/use-interaction-state';
import { SubtleHover } from './index';

const meta: Meta<typeof SubtleHover> = {
  title: 'Actions/SubtleHover',
  component: SubtleHover,
};

export default meta;

type Story = StoryObj<typeof SubtleHover>;

/**
 * Pure-CSS `group-hover`: the parent carries `className="group"` and the wash
 * fades in on hover with ZERO React state (web only).
 */
function HoverRow({ label }: { label: string }) {
  return (
    <Pressable
      {...({ className: 'group' } as Record<string, string>)}
      accessibilityLabel={label}
      style={{
        width: 280,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <SubtleHover style={{ borderRadius: 12 }} />
      <Text style={{ fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export const GroupHover: Story = {
  render: () => <HoverRow label="Hover me (web, group-hover)" />,
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

/**
 * JS `active` mode: hovering anywhere in the thread lights EVERY row together
 * (a coordinated highlight a per-element `group-hover` can't express). `native`
 * is opted in so the same wash shows on native surfaces too.
 */
export const CoordinatedThread: Story = {
  render: () => {
    function Thread() {
      const { state: hovered, onIn, onOut } = useInteractionState();
      return (
        <Pressable onHoverIn={onIn} onHoverOut={onOut} style={{ gap: 4 }}>
          {['First reply', 'Second reply', 'Third reply'].map((label) => (
            <View
              key={label}
              style={{
                width: 280,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <SubtleHover active={hovered} native style={{ borderRadius: 12 }} />
              <Text style={{ fontWeight: '600' }}>{label}</Text>
            </View>
          ))}
        </Pressable>
      );
    }
    return <Thread />;
  },
};
