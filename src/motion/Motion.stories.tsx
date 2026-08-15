import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ScaleAndFadeIn, ScaleAndFadeOut, ScreenTransition, ShrinkAndPop } from './index';

const meta: Meta = {
  title: 'Foundations/Motion',
};

export default meta;

type Story = StoryObj;

function Toggle({ children }: { children: React.ReactNode }) {
  const [shown, setShown] = useState(true);
  return (
    <View style={{ gap: 16, alignItems: 'flex-start' }}>
      <Pressable
        accessibilityLabel="Toggle"
        onPress={() => setShown((v) => !v)}
        style={{
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 8,
          backgroundColor: '#111827',
        }}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>{shown ? 'Hide' : 'Show'}</Text>
      </Pressable>
      <View style={{ height: 96, justifyContent: 'center' }}>{shown ? children : null}</View>
    </View>
  );
}

const card = {
  width: 160,
  height: 72,
  borderRadius: 16,
  backgroundColor: '#6366f1',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

export const ScaleAndFade: Story = {
  render: () => (
    <Toggle>
      <Animated.View entering={ScaleAndFadeIn} exiting={ScaleAndFadeOut} style={card}>
        <Text style={{ color: 'white', fontWeight: '700' }}>Scale + Fade</Text>
      </Animated.View>
    </Toggle>
  ),
};

export const Pop: Story = {
  render: () => (
    <Toggle>
      <Animated.View entering={ScaleAndFadeIn} exiting={ShrinkAndPop} style={card}>
        <Text style={{ color: 'white', fontWeight: '700' }}>Shrink + Pop</Text>
      </Animated.View>
    </Toggle>
  ),
};

export const Transition: Story = {
  render: () => {
    function Demo() {
      const [forward, setForward] = useState(true);
      return (
        <View style={{ gap: 16, alignItems: 'flex-start' }}>
          <Pressable
            accessibilityLabel="Swap direction"
            onPress={() => setForward((v) => !v)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: '#111827',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>
              Direction: {forward ? 'forward' : 'backward'}
            </Text>
          </Pressable>
          <ScreenTransition
            key={forward ? 'forward' : 'backward'}
            direction={forward ? 'forward' : 'backward'}
            enabledWeb
            style={card}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>Screen</Text>
          </ScreenTransition>
        </View>
      );
    }
    return <Demo />;
  },
};
