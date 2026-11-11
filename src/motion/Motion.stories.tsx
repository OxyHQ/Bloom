import type React from 'react';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../typography';
import Animated from 'react-native-reanimated';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  RollingText,
  ScaleAndFadeIn,
  ScaleAndFadeOut,
  ScreenTransition,
  ShrinkAndPop,
  useCountUp,
} from './index';

const meta: Meta = {
  parameters: { controls: { disable: true } },
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
  parameters: { controls: { disable: true } },
  render: () => (
    <Toggle>
      <Animated.View entering={ScaleAndFadeIn} exiting={ScaleAndFadeOut} style={card}>
        <Text style={{ color: 'white', fontWeight: '700' }}>Scale + Fade</Text>
      </Animated.View>
    </Toggle>
  ),
};

export const Pop: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Toggle>
      <Animated.View entering={ScaleAndFadeIn} exiting={ShrinkAndPop} style={card}>
        <Text style={{ color: 'white', fontWeight: '700' }}>Shrink + Pop</Text>
      </Animated.View>
    </Toggle>
  ),
};

export const Transition: Story = {
  parameters: { controls: { disable: true } },
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

/** Text that rolls when it changes: a whole label, a count, and per-digit wheels. */
export const Rolling: Story = {
  render: function RollingStory() {
    const [n, setN] = useState(9);
    const count = useCountUp(n * 100);
    return (
      <View style={{ gap: 16, alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable accessibilityLabel="Down" onPress={() => setN((v) => Math.max(0, v - 1))}>
            <Text>−</Text>
          </Pressable>
          <Pressable accessibilityLabel="Up" onPress={() => setN((v) => v + 1)}>
            <Text>+</Text>
          </Pressable>
        </View>
        <RollingText value={`Week ${n}`} align="center" clip containerStyle={{ width: 120 }} />
        <RollingText value={String(n)} variant="title-2-regular" />
        <RollingText mode="digits" value={`$${n}.99`} variant="title-2-regular" />
        <Text>{count}</Text>
      </View>
    );
  },
};
