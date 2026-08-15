import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useInteractionState } from '../hooks/use-interaction-state';
import { StyledPressable } from '../styles/styled-primitives';
import { SubtleHover } from './index';

const meta: Meta<typeof SubtleHover> = {
  title: 'Components/SubtleHover',
  component: SubtleHover,
};

export default meta;

type Story = StoryObj<typeof SubtleHover>;

/**
 * Pure-CSS `group-hover`: the parent carries `className="group"` and the wash
 * fades in on hover with ZERO React state (web only).
 *
 * The parent is `StyledPressable`, not a bare `Pressable` with a
 * `Record<string, string>` cast. The cast type-checks against nothing and the
 * class never reaches the DOM here — a consumer's NativeWind babel interop
 * rewrites `className` in the CONSUMER's own source, and this file is Bloom's.
 * With the class missing, `group-hover:opacity-50` has no group to hover and
 * the wash stays at 0 forever, which reads as "SubtleHover is broken" while the
 * component is fine.
 */
function HoverRow({ label }: { label: string }) {
  return (
    <StyledPressable
      className="group"
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
    </StyledPressable>
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
