import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tooltip, TooltipTrigger, TooltipTextBubble } from './index';
import { Text } from '../typography';

const meta: Meta = {
  title: 'Overlays/Tooltip',
};

export default meta;

type Story = StoryObj;

/**
 * `Tooltip` is CONTROLLED, and deliberately so: what should open a tooltip
 * differs by platform and by trigger — hover on a desktop pointer, long-press
 * on touch, focus for a keyboard — so the component takes `visible` and leaves
 * that decision to the call site rather than guessing.
 *
 * A tooltip is a hint about a control that is already labelled. It is never the
 * only place a piece of information appears: it cannot be reached by touch
 * without an interaction that also does something else, and it dismisses on the
 * next tap.
 */
export const Basic: Story = {
  render: function BasicStory() {
    const [visible, setVisible] = useState(false);
    return (
      <View style={{ width: 320, paddingTop: 60, alignItems: 'flex-start' }}>
        <Tooltip visible={visible} onVisibleChange={setVisible}>
          <TooltipTrigger>
            <Pressable
              onHoverIn={() => setVisible(true)}
              onHoverOut={() => setVisible(false)}
              onPress={() => setVisible((value) => !value)}
            >
              <Text>Hover or tap me</Text>
            </Pressable>
          </TooltipTrigger>
          <TooltipTextBubble>Copies the link to your clipboard</TooltipTextBubble>
        </Tooltip>
      </View>
    );
  },
};

/**
 * `position` picks the side. It is a preference, not a guarantee — a bubble
 * near a screen edge is nudged back into view, so `top` on an element at the
 * top of the viewport still renders somewhere readable.
 */
export const Position: Story = {
  render: function PositionStory() {
    const [open, setOpen] = useState<'top' | 'bottom' | null>(null);
    return (
      <View style={{ width: 320, paddingVertical: 80, gap: 60 }}>
        {(['top', 'bottom'] as const).map((position) => (
          <Tooltip
            key={position}
            position={position}
            visible={open === position}
            onVisibleChange={(next) => setOpen(next ? position : null)}
          >
            <TooltipTrigger>
              <Pressable onPress={() => setOpen(open === position ? null : position)}>
                <Text>position=&quot;{position}&quot;</Text>
              </Pressable>
            </TooltipTrigger>
            <TooltipTextBubble>Anchored {position}</TooltipTextBubble>
          </Tooltip>
        ))}
      </View>
    );
  },
};

/** Several lines: each child becomes its own line in the bubble. */
export const MultiLine: Story = {
  render: function MultiLineStory() {
    const [visible, setVisible] = useState(true);
    return (
      <View style={{ width: 320, paddingTop: 60, alignItems: 'flex-start' }}>
        <Tooltip visible={visible} onVisibleChange={setVisible}>
          <TooltipTrigger>
            <Pressable onPress={() => setVisible((value) => !value)}>
              <Text>Toggle</Text>
            </Pressable>
          </TooltipTrigger>
          <TooltipTextBubble>
            {'Shift + Enter'}
            {'Sends without leaving the composer'}
          </TooltipTextBubble>
        </Tooltip>
      </View>
    );
  },
};
