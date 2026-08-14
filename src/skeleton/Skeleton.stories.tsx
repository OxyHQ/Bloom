import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import * as Skeleton from './index';

const meta: Meta = {
  title: 'Components/Skeleton',
};

export default meta;

type Story = StoryObj;

/**
 * The primitives. `Skeleton` is a NAMESPACE, not a component: `Text`, `Circle`,
 * `Box`, `Pill`, `Row` and `Col` are collision-prone names, so they ship behind
 * `import * as Skeleton` rather than as top-level exports.
 */
export const Primitives: Story = {
  render: () => (
    <View style={{ gap: 16, width: 320 }}>
      <Skeleton.Text style={{ width: 200 }} />
      <Skeleton.Circle size={48} />
      <Skeleton.Pill size={20} />
      <Skeleton.Box width={280} height={64} />
    </View>
  ),
};

/**
 * The point of the family: a placeholder shaped like the content that is
 * loading. Anything that just dims a grey rectangle can use `Loading` instead —
 * a skeleton earns its cost by holding the layout the real row will take.
 */
export const FeedRow: Story = {
  render: () => (
    <View style={{ gap: 20, width: 360 }}>
      {[0, 1, 2].map((i) => (
        <Skeleton.Row key={i} style={{ gap: 12 }}>
          <Skeleton.Circle size={40} />
          <Skeleton.Col style={{ flex: 1, gap: 8 }}>
            <Skeleton.Text style={{ width: 140 }} />
            <Skeleton.Text style={{ width: '100%' }} />
            <Skeleton.Text style={{ width: '70%' }} />
          </Skeleton.Col>
        </Skeleton.Row>
      ))}
    </View>
  ),
};

/**
 * `blend` halves the shimmer's opacity, for a skeleton sitting on a surface
 * that is itself already dimmed (inside a sheet, behind a backdrop) where the
 * full-strength pulse reads as a second, competing animation.
 */
export const Blend: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 32 }}>
      <Skeleton.Col style={{ gap: 12 }}>
        <Skeleton.Circle size={40} />
        <Skeleton.Box width={120} height={40} />
      </Skeleton.Col>
      <Skeleton.Col style={{ gap: 12 }}>
        <Skeleton.Circle size={40} blend />
        <Skeleton.Box width={120} height={40} blend />
      </Skeleton.Col>
    </View>
  ),
};
