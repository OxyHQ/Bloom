import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tooltip, TooltipTrigger, TooltipTextBubble } from './index';
import { Text } from '../typography';

const meta: Meta = {
  title: 'Base/Tooltip',
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

/**
 * The two sizes, open, on both sides: `sm` (12px Caption 1/Medium, 10/6
 * padding, 8px corner) and `md` (14px Body 1/Medium, 12/8 padding, 10px corner).
 * A white surface with the button hairline, `shadow-dropdown`, and a 12×7 caret
 * 10px from the trigger.
 */
export const Sizes: Story = {
  render: function SizesStory() {
    return (
      <View style={{ paddingVertical: 80, paddingHorizontal: 60, flexDirection: 'row', gap: 120 }}>
        {(['sm', 'md'] as const).map((size) =>
          (['top', 'bottom'] as const).map((position) => (
            <View key={`${size}-${position}`} style={{ alignItems: 'flex-start' }}>
              <Tooltip position={position} visible onVisibleChange={() => {}}>
                <TooltipTrigger>
                  <Text testID={`tooltip-trigger-${size}-${position}`}>
                    {size} {position}
                  </Text>
                </TooltipTrigger>
                <TooltipTextBubble size={size}>Copies the link</TooltipTextBubble>
              </Tooltip>
            </View>
          )),
        )}
      </View>
    );
  },
};

/**
 * The bubble anchors to its TRIGGER, not to the box the tooltip sits in: here
 * the trigger is pushed to the right of a wide column and the bubble still
 * centres on it. (The web bubble is portaled and `position: fixed` against the
 * trigger's measured box, re-measured on scroll and resize.)
 */
export const AnchoredToTrigger: Story = {
  render: function AnchoredStory() {
    return (
      <View style={{ width: 560, paddingVertical: 80, gap: 80 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Tooltip position="top" visible onVisibleChange={() => {}}>
            <TooltipTrigger>
              <Text testID="tooltip-anchored-top">Trigger at the end</Text>
            </TooltipTrigger>
            <TooltipTextBubble>Centred on this trigger</TooltipTextBubble>
          </Tooltip>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Tooltip visible onVisibleChange={() => {}}>
            <TooltipTrigger>
              <Text testID="tooltip-anchored-bottom">Centred trigger</Text>
            </TooltipTrigger>
            <TooltipTextBubble size="md">Below, still on its trigger</TooltipTextBubble>
          </Tooltip>
        </View>
      </View>
    );
  },
};
