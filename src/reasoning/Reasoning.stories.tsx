import type React from 'react';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Reasoning } from './index';

const meta: Meta<typeof Reasoning> = {
  title: 'Blocks/Reasoning',
  component: Reasoning,
  args: {
    durationMs: 12_000,
    size: 'md',
    children:
      'The user wants the build to pass. The failing step is the token generation, so I will regenerate the tokens first and then run the build again.',
  },
  argTypes: {
    streaming: { control: 'boolean' },
    durationMs: { control: 'number' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;

type Story = StoryObj<typeof Reasoning>;

const Frame = ({ children }: { children: React.ReactNode }) => (
  <View style={{ padding: 40, maxWidth: 520 }}>{children}</View>
);

export const Playground: Story = {
  render: (args) => (
    <Frame>
      <Reasoning {...args} />
    </Frame>
  ),
};

/** A string that grows as tokens arrive; the body opens, then closes when the stream ends. */
export const Streaming: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const words =
      'First I check the failing step, then regenerate the tokens, then build again.'.split(' ');
    const [count, setCount] = useState(0);
    const streaming = count < words.length;
    useEffect(() => {
      if (!streaming) return;
      const timer = setTimeout(() => setCount((n) => n + 1), 250);
      return () => clearTimeout(timer);
    }, [count, streaming]);
    return (
      <Frame>
        <Reasoning streaming={streaming} durationMs={words.length * 250}>
          {words.slice(0, count).join(' ')}
        </Reasoning>
      </Frame>
    );
  },
};

export const Durations: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      {[0, 1000, 12_000, 60_000, 95_000].map((ms) => (
        <Reasoning key={ms} durationMs={ms} defaultOpen={false}>
          Reasoning
        </Reasoning>
      ))}
      <Reasoning>No duration known</Reasoning>
    </Frame>
  ),
};
