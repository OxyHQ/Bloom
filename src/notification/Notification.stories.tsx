import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { useTheme } from '../theme/use-theme';
import { RiMailFill } from '../icons/remix/RiMailFill';
import { Notification } from './index';

const meta: Meta<typeof Notification> = {
  title: 'Base/Notification',
  component: Notification,
};

export default meta;

type Story = StoryObj<typeof Notification>;

const noop = () => {};

function Frame({ children, width = 400 }: { children: React.ReactNode; width?: number }) {
  const theme = useTheme();
  return (
    <View
      testID="frame"
      style={{ padding: 16, maxWidth: '100%', gap: 12, backgroundColor: theme.colors.background, alignItems: 'flex-start' }}
    >
      <View style={{ width, maxWidth: '100%', gap: 12 }}>{children}</View>
    </View>
  );
}

/** Every status, the avatar + presence visuals, timestamp, actions and no-close. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <Notification title="New comment" description="Mia replied to your thread." timestamp="2m ago" />
      <Notification
        status="information"
        title="Update available"
        description="Version 2.4 ships with faster sync."
      />
      <Notification status="success" title="Payment received" description="$1,240.00 from Acme Inc." />
      <Notification status="warning" title="Storage almost full" description="You have used 92% of 10 GB." />
      <Notification
        status="error"
        title="Deploy failed"
        description="Build step exited with code 1."
        actions={[
          { label: 'View logs', onPress: noop },
          { label: 'Retry', onPress: noop },
        ]}
      />
      <Notification
        avatar={{ name: 'Mia Chen', presence: 'online' }}
        title="Mia Chen"
        timestamp="Just now"
        description="Can you review the Q3 report before 5pm?"
      />
      <Notification avatar={{ name: 'Leo Park', presence: 'busy' }} title="Leo Park" timestamp="1h" />
      <Notification avatar={{ name: 'Ana Ruiz', presence: 'offline' }} title="Ana Ruiz" dismissible={false} />
      <Notification icon={RiMailFill} status="information" title="Custom icon" dismissible={false} />
    </Frame>
  ),
};

/** Title only — the smallest card. */
export const TitleOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <Notification title="Saved" />
    </Frame>
  ),
};

/** 6-second auto-dismiss with the countdown bar, and the entrance after 0.3s. */
export const AutoDismiss: Story = {
  parameters: { controls: { disable: true } },
  render: function AutoDismissStory() {
    const [key, setKey] = useState(0);
    const [gone, setGone] = useState(false);
    return (
      <Frame>
        <Button size="sm" onPress={() => {
            setGone(false);
            setKey((k) => k + 1);
          }} appearance="outline" tone="neutral">
          Replay
        </Button>
        {gone ? null : (
          <Notification
            key={key}
            status="success"
            title="Upload complete"
            description="report-q3.pdf is ready to share."
            autoDismissDuration={6000}
            introDelay={0.3}
            onDismiss={() => setGone(true)}
          />
        )}
      </Frame>
    );
  },
};

/** A single instance whose controls are applied directly to the rendered component. */
export const Playground: StoryObj<typeof Notification> = {
  args: { title: 'New comment', description: 'Mia replied to your thread.', timestamp: '2m ago', status: 'information', dismissible: true },
  parameters: { controls: { disable: false, include: ['title', 'description', 'timestamp', 'status', 'dismissible'] } },
  argTypes: { title: { control: 'text' }, description: { control: 'text' }, timestamp: { control: 'text' }, status: { control: 'select', options: ['neutral', 'information', 'success', 'warning', 'error'] }, dismissible: { control: 'boolean' } },
  render: function Playground(args) {

    return <View style={{ width: 440, maxWidth: '100%' }}><Notification {...args} /></View>;
  },
};
