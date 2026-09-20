import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { useTheme } from '../theme/use-theme';
import { RiSparklingFill } from '../icons/remix/RiSparklingFill';
import { Announcement } from './index';

const meta: Meta<typeof Announcement> = {
  argTypes: {
    "dismissible": { control: 'boolean' },
    "closeLabel": { control: 'text' },
    "introDelay": { control: 'number' }
  },
  title: 'Base/Announcement',
  component: Announcement,
};

export default meta;

type Story = StoryObj<typeof Announcement>;

const noop = () => {};

function Frame({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ padding: 40, backgroundColor: theme.colors.background, alignItems: 'flex-start' }}>
      {/* 236px: the card inside a 260px sidebar. */}
      <View testID="frame" style={{ width: 236, gap: 16 }}>
        {children}
      </View>
    </View>
  );
}

/** The full event card, then each optional part removed. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <Announcement
        title="Upgrade to Pro"
        description="Unlock unlimited projects and priority support."
        actionLabel="Upgrade now"
        onAction={noop}
        dismissible
      />
      <Announcement title="New: AI summaries" description="Summaries now appear on every document." dismissible />
      <Announcement title="Title only" />
      <Announcement icon={RiSparklingFill} title="Custom icon" actionLabel="Try it" onAction={noop} />
    </Frame>
  ),
};

/** Dismiss plays the blur + scale-down exit; Replay runs the entrance after 0.4s. */
export const Dismissible: Story = {
  args: { title: "Upgrade to Pro", description: "Unlock unlimited projects and priority support.", actionLabel: "Upgrade now", dismissible: true },
  parameters: { controls: { include: ["title","description","actionLabel","dismissible","closeLabel"] } },
  render: function DismissibleStory(args) {
    const [key, setKey] = useState(0);
    return (
      <Frame>
        <Button size="sm" onPress={() => setKey((k) => k + 1)} appearance="outline" tone="neutral">
          Replay
        </Button>
        <Announcement {...args}
          key={key}



          onAction={noop}

          introDelay={key === 0 ? undefined : 0.4}
        />
      </Frame>
    );
  },
};
