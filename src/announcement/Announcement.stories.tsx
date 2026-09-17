import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { useTheme } from '../theme/use-theme';
import { RiSparklingFill } from '../icons/remix/RiSparklingFill';
import { Announcement } from './index';

const meta: Meta<typeof Announcement> = {
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
  render: function DismissibleStory() {
    const [key, setKey] = useState(0);
    return (
      <Frame>
        <Button size="small" variant="secondary" onPress={() => setKey((k) => k + 1)}>
          Replay
        </Button>
        <Announcement
          key={key}
          title="Upgrade to Pro"
          description="Unlock unlimited projects and priority support."
          actionLabel="Upgrade now"
          onAction={noop}
          dismissible
          introDelay={key === 0 ? undefined : 0.4}
        />
      </Frame>
    );
  },
};
