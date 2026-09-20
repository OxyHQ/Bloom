import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';
import { AgentThinking } from './index';
import type { AgentThinkingTone, AgentThinkingVariant } from './types';

const meta: Meta<typeof AgentThinking> = {
  title: 'Blocks/Agent Thinking',
  component: AgentThinking,
  args: { variant: 'wave', label: 'Thinking', shimmer: true, showTimer: true },
  argTypes: {
    "label": { control: 'text' },
    "shimmer": { control: 'boolean' },
    "showTimer": { control: 'boolean' },
    variant: { control: 'inline-radio', options: ['wave', 'spin', 'stars', 'infinity'] },
    tone: { control: 'inline-radio', options: [undefined, 'subtle', 'default', 'primary', 'accent'] },
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
    <View testID={testID} style={{ padding: 40, gap: 16, alignItems: 'flex-start', backgroundColor: colors.background }}>
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
