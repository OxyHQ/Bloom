import React, { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AnimatedCheck } from './index';
import type { AnimatedCheckRef } from './types';

const meta: Meta<typeof AnimatedCheck> = {
  title: 'Components/AnimatedCheck',
  component: AnimatedCheck,
  argTypes: {
    size: { control: { type: 'range', min: 16, max: 128, step: 4 } },
    color: { control: 'color' },
  },
};

export default meta;

type Story = StoryObj<typeof AnimatedCheck>;

export const Playable: Story = {
  args: { size: 64 },
  render: (args) => {
    function Demo() {
      const ref = useRef<AnimatedCheckRef>(null);
      return (
        <View style={{ gap: 16, alignItems: 'center' }}>
          <AnimatedCheck ref={ref} {...args} />
          <Pressable
            accessibilityLabel="Play"
            onPress={() => ref.current?.play()}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: '#111827',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Play</Text>
          </Pressable>
        </View>
      );
    }
    return <Demo />;
  },
};

export const CustomColor: Story = {
  args: { size: 80, color: '#6366f1' },
  render: (args) => {
    function Demo() {
      const ref = useRef<AnimatedCheckRef>(null);
      return (
        <Pressable accessibilityLabel="Replay" onPress={() => ref.current?.play()}>
          <AnimatedCheck ref={ref} {...args} />
        </Pressable>
      );
    }
    return <Demo />;
  },
};
