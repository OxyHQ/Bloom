import { useState } from 'react';
import { fn } from 'storybook/test';
import { DEMO_NOTIFICATIONS } from './__fixtures__/story-data';
import { useArgs } from 'storybook/preview-api';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { NotificationCenter } from './index';

const meta: Meta<typeof NotificationCenter> = {
  id: 'blocks-notification-center',
  title: 'Patterns/Account/Notification Center',
  component: NotificationCenter,
};

export default meta;

type Story = StoryObj<typeof NotificationCenter>;

function NotificationDemo({ mentions = false }: { mentions?: boolean }) {
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  return (
    <View style={{ width: '100%', maxWidth: 440 }}>
      <NotificationCenter
        testID="center"
        notifications={notifications}
        defaultTab={mentions ? 'mentions' : 'all'}
        onMarkAllRead={() =>
          setNotifications((current) => current.map((item) => ({ ...item, unread: false })))
        }
        onAction={fn().mockName('NotificationCenter.onAction')}
      />
    </View>
  );
}

export const Default: Story = { render: () => <NotificationDemo /> };

/** Every disc tone, with and without an explicit icon. */
export const Statuses: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 430, maxWidth: '100%' }}>
      <NotificationCenter
        notifications={(['neutral', 'information', 'success', 'error'] as const).map((status) => ({
          id: status,
          category: 'system',
          group: 'Today',
          title: `A ${status} notification`,
          description: 'The default glyph for the status, on its tinted disc.',
          timestamp: 'now',
          unread: status !== 'neutral',
          status,
        }))}
      />
    </View>
  ),
};

export const Empty: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 430, maxWidth: '100%' }}>
      <NotificationCenter testID="center" notifications={[]} />
    </View>
  ),
};

/** The Mentions tab selected, from `defaultTab`. */
export const MentionsTab: Story = { render: () => <NotificationDemo mentions /> };

/** A single instance whose controls are applied directly to the rendered component. */
export const Playground: StoryObj<typeof NotificationCenter> = {
  args: { notifications: DEMO_NOTIFICATIONS, title: 'Notifications', tab: 'all' },
  parameters: { controls: { disable: false, include: ['title', 'tab'] } },
  argTypes: {
    title: { control: 'text' },
    tab: { control: 'select', options: ['all', 'mentions', 'system'] },
  },
  render: function Playground(args) {
    const [, updateArgs] = useArgs();
    return (
      <View style={{ width: 440, maxWidth: '100%' }}>
        <NotificationCenter {...args} onTabChange={(next) => updateArgs({ tab: next })} />
      </View>
    );
  },
};
