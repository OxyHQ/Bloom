import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';
import { AgentThinking } from './index';
import type { AgentThinkingTone, AgentThinkingVariant } from './types';

const meta: Meta<typeof AgentThinking> = {
  title: 'Agents/Agent Thinking',
  component: AgentThinking,
  args: { variant: 'wave', label: 'Thinking', shimmer: true, showTimer: true },
  argTypes: {
    label: { control: 'text' },
    shimmer: { control: 'boolean' },
    showTimer: { control: 'boolean' },
    variant: { control: 'inline-radio', options: ['wave', 'spin', 'stars', 'infinity'] },
    tone: {
      control: 'inline-radio',
      options: [undefined, 'subtle', 'default', 'primary', 'accent'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof AgentThinking>;

const VARIANTS: AgentThinkingVariant[] = ['wave', 'spin', 'stars', 'infinity'];
const TONES: AgentThinkingTone[] = ['subtle', 'default', 'primary', 'accent'];

/** Paints the theme background, so the dark globals read as a dark page. */
function Frame({ children, testID }: { children: React.ReactNode; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      style={{ padding: 40, gap: 16, alignItems: 'flex-start', backgroundColor: colors.background }}
    >
      {children}
    </View>
  );
}

export const Playground: Story = {};

/** The four curated variants, each at its default tone. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame testID="variants">
      <AgentThinking variant="wave" label="Thinking" />
      <AgentThinking variant="spin" label="Searching the docs" />
      <AgentThinking variant="stars" label="Planning next steps" />
      <AgentThinking variant="infinity" label="Generating" />
    </Frame>
  ),
};

/** Every variant × tone. */
export const Tones: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      {TONES.map((tone) => (
        <View key={tone} style={{ flexDirection: 'row', gap: 32, flexWrap: 'wrap' }}>
          {VARIANTS.map((variant) => (
            <AgentThinking key={variant} variant={variant} tone={tone} label={tone} />
          ))}
        </View>
      ))}
    </Frame>
  ),
};

/** Without the label shimmer and without the timer. */
export const Static: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      {VARIANTS.map((variant) => (
        <AgentThinking key={variant} variant={variant} shimmer={false} showTimer={false} />
      ))}
    </Frame>
  ),
};

const REASONING =
  'The user wants the build to pass. The failing step is the token generation, so I will regenerate the tokens first and then run the build again.';

/** Give it children and the row becomes a disclosure: open while thinking, shut once done. */
export const Disclosure: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ padding: 40, maxWidth: 520, gap: 16 }}>
      <AgentThinking defaultOpen>{REASONING}</AgentThinking>
      <AgentThinking thinking={false} durationMs={12_000}>
        {REASONING}
      </AgentThinking>
      <AgentThinking thinking={false} durationMs={12_000} defaultOpen>
        {REASONING}
      </AgentThinking>
    </View>
  ),
};

/** A string that grows as tokens arrive; the body opens, then closes when the stream ends. */
export const StreamingReasoning: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const words =
      'First I check the failing step, then regenerate the tokens, then build again.'.split(' ');
    const [count, setCount] = useState(0);
    const thinking = count < words.length;
    useEffect(() => {
      if (!thinking) return;
      const timer = setTimeout(() => setCount((n) => n + 1), 250);
      return () => clearTimeout(timer);
    }, [count, thinking]);
    return (
      <View style={{ padding: 40, maxWidth: 520 }}>
        <AgentThinking thinking={thinking} durationMs={words.length * 250}>
          {words.slice(0, count).join(' ')}
        </AgentThinking>
      </View>
    );
  },
};

/** The finished header: under half a second, seconds, minutes, and no duration at all. */
export const Durations: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ padding: 40, maxWidth: 520, gap: 8 }}>
      {[0, 1000, 12_000, 60_000, 95_000].map((ms) => (
        <AgentThinking key={ms} thinking={false} durationMs={ms} />
      ))}
      <AgentThinking thinking={false} />
    </View>
  ),
};
