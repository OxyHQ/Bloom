import { useArgs } from 'storybook/preview-api';
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
      { id: 'reply', label: 'Reply', appearance: 'solid', tone: 'accent' },
      { id: 'view', label: 'View thread', appearance: 'outline', tone: 'neutral' },
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
    actions: [{ id: 'download', label: 'Download', appearance: 'outline', tone: 'neutral' }],
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
    actions: [{ id: 'review', label: 'Review changes', appearance: 'outline', tone: 'neutral' }],
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
      { id: 'retry', label: 'Retry', appearance: 'solid', tone: 'accent' },
      { id: 'logs', label: 'View logs', appearance: 'outline', tone: 'neutral' },
    ],
  },
];

export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 430, maxWidth: '100%' }}>
      <NotificationCenter testID="center" notifications={DEMO_NOTIFICATIONS} />
    </View>
  ),
};

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
export const MentionsTab: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 430, maxWidth: '100%' }}>
      <NotificationCenter notifications={DEMO_NOTIFICATIONS} defaultTab="mentions" />
    </View>
  ),
};

/** A single instance whose controls are applied directly to the rendered component. */
export const Playground: StoryObj<typeof NotificationCenter> = {
  args: { notifications: DEMO_NOTIFICATIONS, title: 'Notifications', tab: 'all' },
  parameters: { controls: { disable: false, include: ['title', 'tab'] } },
  argTypes: { title: { control: 'text' }, tab: { control: 'select', options: ['all', 'mentions', 'system'] } },
  render: function Playground(args) {
    const [, updateArgs] = useArgs();
    return <View style={{ width: 440, maxWidth: '100%' }}><NotificationCenter {...args} onTabChange={next => updateArgs({ tab: next })} /></View>;
  },
};
