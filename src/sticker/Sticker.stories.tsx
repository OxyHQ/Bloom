import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Sticker } from './index';

const STILL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="200" fill="#f5b83d"/><circle cx="190" cy="220" r="24" fill="#222"/><circle cx="322" cy="220" r="24" fill="#222"/><path d="M170 320 q86 70 172 0" stroke="#222" stroke-width="20" fill="none" stroke-linecap="round"/></svg>',
  );

/**
 * A tiny Lottie document — a square sliding across the canvas — served as a
 * data URL so the story needs no network.
 */
const ANIMATION =
  'data:application/json;charset=utf-8,' +
  encodeURIComponent(
    JSON.stringify({
      v: '5.7.4', fr: 30, ip: 0, op: 60, w: 512, h: 512, assets: [],
      layers: [{
        ty: 4, ind: 1, ip: 0, op: 60, st: 0,
        ks: {
          o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] },
          p: { a: 1, k: [{ t: 0, s: [128, 256, 0], i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] } }, { t: 59, s: [384, 256, 0] }] },
        },
        shapes: [
          { ty: 'rc', d: 1, s: { a: 0, k: [200, 200] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 40 } },
          { ty: 'fl', c: { a: 0, k: [0.2, 0.4, 0.9, 1] }, o: { a: 0, k: 100 }, r: 1 },
        ],
      }],
    }),
  );

const meta: Meta<typeof Sticker> = {
  title: 'Messaging/Sticker',
  component: Sticker,
  argTypes: {
    size: { control: { type: 'range', min: 48, max: 256, step: 8 } },
    paused: { control: 'boolean' },
    loop: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof Sticker>;

export const Animated: Story = {
  args: { animation: ANIMATION, fallback: STILL, size: 160, accessibilityLabel: 'Sticker: sliding square' },
};

/** No animation: the still is the sticker. */
export const Still: Story = {
  args: { fallback: STILL, size: 160, accessibilityLabel: 'Sticker: smiling sun' },
};

export const Sizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-end' }}>
      {[64, 96, 128, 192].map((size) => (
        <Sticker key={size} animation={ANIMATION} fallback={STILL} size={size} />
      ))}
    </View>
  ),
};
