import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';

import { NotificationsScreen } from './index';
import type { NotificationsScreenItem } from './types';

const meta: Meta<typeof NotificationsScreen> = {
  id: 'blocks-notifications-screen',
  title: 'Patterns/Account/Notifications Screen',
  component: NotificationsScreen,
};

export default meta;

type Story = StoryObj<typeof NotificationsScreen>;

const ITEMS: NotificationsScreenItem[] = [
  {
    id: 'follow',
    title: 'Livia Saris followed you',
    timestamp: '2m',
    unread: true,
    avatar: { initials: 'LS', name: 'Livia Saris', color: 'pink' },
  },
  {
    id: 'deploy',
    title: 'Deploy finished',
    description: 'main is live on all regions.',
    timestamp: '1h',
    unread: true,
    status: 'success',
  },
  {
    id: 'welcome',
    title: 'Welcome to Oxy',
    description: 'Tell us what you build and we will tailor your feed.',
    timestamp: 'Mon',
  },
];

/** Rows, "Mark all read" and the push row; read state is the caller's. */
export const List: Story = {
  render: () => {
    const [items, setItems] = useState(ITEMS);
    const [push, setPush] = useState(false);
    return (
      <NotificationsScreen
        notifications={items}
        title="Notifications"
        onNotificationPress={(id) =>
          setItems((all) => all.map((n) => (n.id === id ? { ...n, unread: false } : n)))
        }
        onMarkAllRead={() => setItems((all) => all.map((n) => ({ ...n, unread: false })))}
        push={{ enabled: push, onChange: setPush }}
      />
    );
  },
};

export const Empty: Story = { args: { notifications: [] } };

export const Loading: Story = { args: { notifications: undefined, loading: true } };

export const LoadError: Story = {
  args: { notifications: undefined, error: true, onRetry: () => undefined },
};

export const PushBlocked: Story = {
  args: {
    notifications: ITEMS,
    push: { enabled: false, onChange: () => undefined, blocked: true },
  },
};
