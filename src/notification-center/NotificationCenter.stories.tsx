import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  RiDownloadCloud2Line,
  RiGitPullRequestLine,
  RiShieldCheckLine,
  RiUserAddLine,
} from '../icons/remix';
import { NotificationCenter } from './index';
import type { NotificationCenterItem } from './types';

const meta: Meta<typeof NotificationCenter> = {
  title: 'Blocks/Notification Center',
  component: NotificationCenter,
  // The demo data is exported for the AppShell stories; it is not a story.
  excludeStories: /^DEMO_/,
};

export default meta;

type Story = StoryObj<typeof NotificationCenter>;

/** Demo inbox data, initials for the photos. */
export const DEMO_NOTIFICATIONS: NotificationCenterItem[] = [
  {
    id: 'mention-notes',
    category: 'mentions',
    group: 'Today',
    title: 'Livia mentioned you',
    description: 'Can you review the new empty state before we ship the dashboard?',
    timestamp: '2m',
    unread: true,
    avatar: { initials: 'LS', name: 'Livia Saris', color: 'pink' },
    actions: [
      { id: 'reply', label: 'Reply', variant: 'primary' },
      { id: 'view', label: 'View thread', variant: 'secondary' },
    ],
  },
  {
    id: 'backup-ready',
    category: 'system',
    group: 'Today',
    title: 'Workspace backup is ready',
    description: 'The July 23 backup finished successfully and is ready to download.',
    timestamp: '18m',
    unread: true,
    status: 'success',
    icon: RiDownloadCloud2Line,
    actions: [{ id: 'download', label: 'Download', variant: 'secondary' }],
  },
  {
    id: 'project-invite',
    category: 'activity',
    group: 'Today',
    title: 'You joined Project Sea',
    description: 'Maria added you as an editor. You now have access to all project files.',
    timestamp: '1h',
    unread: true,
    icon: RiUserAddLine,
    status: 'information',
  },
  {
    id: 'pull-request',
    category: 'mentions',
    group: 'Earlier this week',
    title: 'Jaydon requested your review',
    description: 'Pull request #284 updates the notification preferences flow.',
    timestamp: 'Mon',
    avatar: { initials: 'JA', name: 'Jaydon Aminoff', color: 'blue' },
    actions: [{ id: 'review', label: 'Review changes', variant: 'secondary' }],
  },
  {
    id: 'security-check',
    category: 'system',
    group: 'Earlier this week',
    title: 'Security check completed',
    description: 'No exposed credentials or vulnerable dependencies were found.',
    timestamp: 'Sun',
    status: 'success',
    icon: RiShieldCheckLine,
  },
  {
    id: 'deploy-failed',
    category: 'system',
    group: 'Earlier this week',
    title: 'Preview deployment failed',
    description: 'The build stopped while validating the application routes.',
    timestamp: 'Sat',
    unread: true,
    status: 'error',
    icon: RiGitPullRequestLine,
    actions: [
      { id: 'retry', label: 'Retry', variant: 'primary' },
      { id: 'logs', label: 'View logs', variant: 'secondary' },
    ],
  },
];

export const Default: Story = {
  render: () => (
    <View style={{ width: 430 }}>
      <NotificationCenter testID="center" notifications={DEMO_NOTIFICATIONS} />
    </View>
  ),
};

/** Every disc tone, with and without an explicit icon. */
export const Statuses: Story = {
  render: () => (
    <View style={{ width: 430 }}>
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
  render: () => (
    <View style={{ width: 430 }}>
      <NotificationCenter testID="center" notifications={[]} />
    </View>
  ),
};

/** The Mentions tab selected, from `defaultTab`. */
export const MentionsTab: Story = {
  render: () => (
    <View style={{ width: 430 }}>
      <NotificationCenter notifications={DEMO_NOTIFICATIONS} defaultTab="mentions" />
    </View>
  ),
};
