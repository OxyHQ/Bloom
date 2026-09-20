import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ProgressiveBlur } from './index';
import { Text } from '../typography';

const meta: Meta<typeof ProgressiveBlur> = {
  title: 'Base/Progressive Blur',
  component: ProgressiveBlur,
};

export default meta;

type Story = StoryObj<typeof ProgressiveBlur>;

function Content() {
  return (
    <View style={{ padding: 16, gap: 10 }}>
      {Array.from({ length: 12 }, (_, index) => (
        <Text key={index} style={{ fontSize: 16 }}>
          Line {index + 1} — content that scrolls under the blurred edge
        </Text>
      ))}
    </View>
  );
}

/**
 * A blur that FADES rather than ending in a line. Put it behind a floating tab
 * bar or a transparent header so content dissolves into the chrome instead of
 * meeting a hard edge halfway up a word.
 *
 * The two platforms reach the same picture differently: iOS has no variable-blur
 * API, so the native fork stacks ten thin blur layers whose per-layer step is
 * imperceptible; the web fork uses one masked `backdrop-filter`, because ten
 * stacked backdrop passes would cost far more than the one the browser does
 * natively. Nothing at the call site changes.
 */
export const Bottom: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 360, maxWidth: '100%', height: 260, overflow: 'hidden' }}>
      <Content />
      <ProgressiveBlur
        direction="bottom"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 96 }}
      />
    </View>
  ),
};

/** Anchored to the top, for a transparent header. */
export const Top: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 360, maxWidth: '100%', height: 260, overflow: 'hidden' }}>
      <Content />
      <ProgressiveBlur
        direction="top"
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 96 }}
      />
    </View>
  ),
};

/**
 * `intensity` follows `expo-blur`'s 0–100 scale. It is worth being conservative:
 * the blur exists so text stays legible while passing under the chrome, and a
 * very high value turns the strip into an opaque band that reads as a bug.
 */
export const Intensities: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', maxWidth: '100%', gap: 16 }}>
      {[3, 10, 30].map((intensity) => (
        <View key={intensity} style={{ width: 200, height: 200, overflow: 'hidden' }}>
          <Content />
          <ProgressiveBlur
            direction="bottom"
            intensity={intensity}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 96 }}
          />
        </View>
      ))}
    </View>
  ),
};

export const Playground: StoryObj<typeof ProgressiveBlur> = {
  args: { direction: 'bottom', intensity: 70 },
  parameters: { controls: { disable: false, include: ['direction', 'intensity'] } },
  argTypes: { direction: { control: 'select', options: ['top','bottom'] }, intensity: { control: { type: 'range', min: 0, max: 100 } } },
  render: function Playground(args) {

    return <View style={{ width: 520, maxWidth: '100%' }}><View style={{ height: 260, overflow: 'hidden' }}><Content /><ProgressiveBlur {...args} style={{ position: 'absolute', left: 0, right: 0, ...(args.direction === 'top' ? { top: 0 } : { bottom: 0 }), height: 100 }} /></View></View>;
  },
};
